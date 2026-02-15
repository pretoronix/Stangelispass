import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useExportData } from "@/hooks/home/useExportData";
import { getBeers } from "@/services/supabase";
import { reportError } from "@/utils/logger";

jest.mock("@/services/supabase", () => ({
  getBeers: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

function setPlatformOS(os: "web" | "ios") {
  try {
    Object.defineProperty(Platform, "OS", { value: os });
  } catch {
    (Platform as any).OS = os;
  }
}

describe("useExportData", () => {
  const originalOS = Platform.OS;
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformOS("ios");
  });

  afterEach(() => {
    setPlatformOS(originalOS as any);
  });

  it("alerts when no active event provided", async () => {
    const { handleExportData } = useExportData();
    await handleExportData(undefined);
    expect(alertSpy).toHaveBeenCalledWith(
      "Export",
      "No active round to export.",
    );
  });

  it("alerts when there are no beers for the event", async () => {
    (getBeers as jest.Mock).mockResolvedValueOnce([]);
    const { handleExportData } = useExportData();
    await handleExportData({ id: "e1", name: "Round 1" });
    expect(alertSpy).toHaveBeenCalledWith(
      "Export",
      "No beers logged for this event yet.",
    );
  });

  it("exports via download on web", async () => {
    setPlatformOS("web");
    const click = jest.fn();
    const appendChild = jest.fn();
    const removeChild = jest.fn();

    (global as any).window = {
      URL: {
        createObjectURL: jest.fn(() => "blob:url"),
        revokeObjectURL: jest.fn(),
      },
    };
    (global as any).document = {
      body: { appendChild, removeChild },
      createElement: jest.fn(() => ({
        click,
        set href(v: string) {},
        set download(v: string) {},
      })),
    };

    (getBeers as jest.Mock).mockResolvedValueOnce([
      {
        id: "b1",
        event_id: "e1",
        created_at: "2026-01-01T00:00:00.000Z",
        user: { name: "Alice" },
        added_by_user: { name: "Bob" },
      },
    ]);

    const { handleExportData } = useExportData();
    await handleExportData({ id: "e1", name: "Round 1" });

    expect(click).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Export",
      "CSV downloaded successfully!",
    );
  });

  it("exports via native sharing when available", async () => {
    setPlatformOS("ios");
    (getBeers as jest.Mock).mockResolvedValueOnce([
      {
        id: "b1",
        event_id: "e1",
        created_at: "2026-01-01T00:00:00.000Z",
        user: { name: "Alice" },
        added_by_user: { name: "Bob" },
      },
    ]);
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    const { handleExportData } = useExportData();
    await handleExportData({ id: "e1", name: "Round 1" });

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it("reports and alerts on native filesystem failures", async () => {
    setPlatformOS("ios");
    (getBeers as jest.Mock).mockResolvedValueOnce([
      {
        id: "b1",
        event_id: "e1",
        created_at: "2026-01-01T00:00:00.000Z",
        user: { name: "Alice" },
        added_by_user: { name: "Bob" },
      },
    ]);

    (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(
      new Error("fs"),
    );

    const { handleExportData } = useExportData();
    await handleExportData({ id: "e1", name: "Round 1" });

    expect(reportError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to export data.");
  });
});
