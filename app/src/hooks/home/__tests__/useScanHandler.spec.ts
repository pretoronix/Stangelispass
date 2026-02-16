import { Alert } from "react-native";
import { useScanHandler } from "@/hooks/home/useScanHandler";
import { parseScanPayload } from "@/utils/scanPayload";
import { addBeer, joinEvent, redeemBeerStamp } from "@/services/supabase";
import { audioService } from "@/services/audio";
import { reportError } from "@/utils/logger";
import * as Haptics from "expo-haptics";

jest.mock("@/utils/scanPayload", () => ({
  parseScanPayload: jest.fn(),
}));

jest.mock("@/services/supabase", () => ({
  addBeer: jest.fn(),
  joinEvent: jest.fn(),
  redeemBeerStamp: jest.fn(),
}));

jest.mock("@/services/audio", () => ({
  audioService: { playPsst: jest.fn() },
}));

jest.mock("@/services/achievements", () => ({
  BADGES: {
    badge1: { name: "Badge One" },
  },
}));

describe("useScanHandler", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("alerts on unknown payload", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({ type: "unknown" });
    const setScanning = jest.fn();
    const refresh = jest.fn();
    const openNamePrompt = jest.fn();

    const { handleScan } = useScanHandler(
      null,
      null,
      { canManageLogs: false },
      openNamePrompt,
      setScanning,
      refresh,
    );
    await handleScan("x");

    expect(alertSpy).toHaveBeenCalledWith("Invalid QR", expect.any(String));
  });

  it("join_event prompts for name when user is missing", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "join_event",
      eventName: "Round",
      eventId: "e1",
    });
    const setScanning = jest.fn();
    const refresh = jest.fn();
    const openNamePrompt = jest.fn();

    const { handleScan } = useScanHandler(
      null,
      null,
      { canManageLogs: false },
      openNamePrompt,
      setScanning,
      refresh,
    );
    await handleScan("x");

    expect(openNamePrompt).toHaveBeenCalledWith("join_event", "Round", "e1");
    expect(setScanning).toHaveBeenCalledWith(false);
  });

  it("join_event calls joinEvent when user exists and reports join errors", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "join_event",
      eventName: "Round",
      eventId: "e1",
    });
    (joinEvent as jest.Mock).mockRejectedValueOnce("fail");

    const setScanning = jest.fn();
    const refresh = jest.fn();
    const openNamePrompt = jest.fn();

    const { handleScan } = useScanHandler(
      { id: "u1" },
      null,
      { canManageLogs: false },
      openNamePrompt,
      setScanning,
      refresh,
    );
    await handleScan("x");

    expect(joinEvent).toHaveBeenCalledWith("e1", "u1");
    expect(reportError).toHaveBeenCalled();
    expect(setScanning).toHaveBeenCalledWith(false);
  });

  it("stamp_redeem blocks when user is missing", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "stamp_redeem",
      stampId: "s1",
    });

    const { handleScan } = useScanHandler(
      null,
      null,
      { canManageLogs: false },
      jest.fn(),
      jest.fn(),
      jest.fn(),
    );
    await handleScan("x");

    expect(alertSpy).toHaveBeenCalledWith("Select User", expect.any(String));
  });

  it("stamp_redeem alerts on invalid stamp and completes on success", async () => {
    (parseScanPayload as jest.Mock)
      .mockReturnValueOnce({ type: "stamp_redeem", stampId: "s1" })
      .mockReturnValueOnce({ type: "stamp_redeem", stampId: "s2" });

    (redeemBeerStamp as jest.Mock)
      .mockResolvedValueOnce({ ok: false, reason: "invalid_stamp" })
      .mockResolvedValueOnce({ ok: true, newBadges: ["badge1"] });

    const setScanning = jest.fn();
    const refresh = jest.fn();
    const { handleScan } = useScanHandler(
      { id: "u1" },
      null,
      { canManageLogs: false },
      jest.fn(),
      setScanning,
      refresh,
    );

    await handleScan("x");
    expect(alertSpy).toHaveBeenCalledWith("Stamp", expect.any(String));
    expect(setScanning).toHaveBeenCalledWith(false);

    await handleScan("y");
    expect(audioService.playPsst).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("logs beer via scan when authorized", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "beer_log",
      userId: "u2",
      eventId: "e1",
    });
    (addBeer as jest.Mock).mockResolvedValueOnce({ newBadges: [] });

    const setScanning = jest.fn();
    const refresh = jest.fn();

    const { handleScan } = useScanHandler(
      { id: "u1" },
      { id: "e1" },
      { canManageLogs: true },
      jest.fn(),
      setScanning,
      refresh,
    );

    await handleScan("x");

    expect(addBeer).toHaveBeenCalledWith("u2", "u1", "e1");
    expect(setScanning).toHaveBeenCalledWith(false);
    expect(refresh).toHaveBeenCalled();
  });

  it("blocks participant QR scan for non-organizers", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "beer_log",
      userId: "u2",
      eventId: "e1",
    });

    const setScanning = jest.fn();
    const refresh = jest.fn();

    const { handleScan } = useScanHandler(
      { id: "u1" },
      { id: "e1" },
      { canManageLogs: false },
      jest.fn(),
      setScanning,
      refresh,
    );

    await handleScan("x");

    expect(alertSpy).toHaveBeenCalledWith(
      "Not Authorized",
      expect.stringContaining("organizers"),
    );
    expect(addBeer).not.toHaveBeenCalled();
  });

  it("alerts when organizer scans without an active event", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "beer_log",
      userId: "u2",
      eventId: "e1",
    });

    const { handleScan } = useScanHandler(
      { id: "u1" },
      null,
      { canManageLogs: true },
      jest.fn(),
      jest.fn(),
      jest.fn(),
    );

    await handleScan("x");

    expect(alertSpy).toHaveBeenCalledWith(
      "No Active Round",
      expect.any(String),
    );
    expect(addBeer).not.toHaveBeenCalled();
  });

  it("alerts when organizer scans the wrong round", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "beer_log",
      userId: "u2",
      eventId: "e2",
    });

    const { handleScan } = useScanHandler(
      { id: "u1" },
      { id: "e1" },
      { canManageLogs: true },
      jest.fn(),
      jest.fn(),
      jest.fn(),
    );

    await handleScan("x");

    expect(alertSpy).toHaveBeenCalledWith("Wrong Round", expect.any(String));
    expect(addBeer).not.toHaveBeenCalled();
  });

  it("debounces duplicate scans within the window", async () => {
    (parseScanPayload as jest.Mock).mockReturnValue({
      type: "beer_log",
      userId: "u2",
      eventId: "e1",
    });
    (addBeer as jest.Mock).mockResolvedValue({ newBadges: [] });

    const setScanning = jest.fn();
    const refresh = jest.fn();
    const { handleScan } = useScanHandler(
      { id: "u1" },
      { id: "e1" },
      { canManageLogs: true },
      jest.fn(),
      setScanning,
      refresh,
    );

    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1000);
    await handleScan("same");
    nowSpy.mockReturnValue(1500);
    await handleScan("same");
    nowSpy.mockRestore();

    expect(addBeer).toHaveBeenCalledTimes(1);
  });

  it("handles haptics failures and still completes badge path", async () => {
    (parseScanPayload as jest.Mock).mockReturnValueOnce({
      type: "beer_log",
      userId: "u2",
      eventId: "e1",
    });
    (addBeer as jest.Mock).mockResolvedValueOnce({ newBadges: ["badge1"] });
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(
      new Error("no haptics"),
    );
    (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(
      new Error("no haptics"),
    );

    const setScanning = jest.fn();
    const refresh = jest.fn();

    const { handleScan } = useScanHandler(
      { id: "u1" },
      { id: "e1" },
      { canManageLogs: true },
      jest.fn(),
      setScanning,
      refresh,
    );

    await handleScan("x");

    expect(addBeer).toHaveBeenCalled();
    expect(setScanning).toHaveBeenCalledWith(false);
    expect(refresh).toHaveBeenCalled();
    expect(audioService.playPsst).toHaveBeenCalled();
  });
});
