import {
  buildQrImageUriFromRef,
  canProceed,
  cleanupSharedFile,
  showNoActiveRound,
  showNotAuthorized,
  showUnavailable,
} from "@/utils/add/addHelpers";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { reportError } from "@/utils/logger";

jest.mock("expo-file-system", () => ({
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn(async () => null),
  deleteAsync: jest.fn(async () => null),
}));

describe("addHelpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(123);
  });

  afterEach(() => {
    jest.useRealTimers();
    (Date.now as unknown as jest.Mock).mockRestore?.();
  });

  it("alert helpers call Alert.alert with expected titles", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    showUnavailable("x");
    expect(alertSpy).toHaveBeenCalledWith("Unavailable", "x");

    showNoActiveRound("y");
    expect(alertSpy).toHaveBeenCalledWith("No Active Round", "y");

    showNotAuthorized("z");
    expect(alertSpy).toHaveBeenCalledWith("Not Authorized", "z");

    alertSpy.mockRestore();
  });

  it("canProceed calls onFail when condition is false", () => {
    const onFail = jest.fn();
    expect(canProceed(false, onFail)).toBe(false);
    expect(onFail).toHaveBeenCalled();
  });

  it("canProceed does not call onFail when condition is true", () => {
    const onFail = jest.fn();
    expect(canProceed(true, onFail)).toBe(true);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("buildQrImageUriFromRef writes a png and returns file uri", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const qrRef: any = {
      current: {
        toDataURL: (cb: (data: string) => void) => cb("BASE64DATA"),
      },
    };

    const uri = await buildQrImageUriFromRef(qrRef, "u1");
    expect(uri).toBe("file:///cache/qr-u1-123.png");
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///cache/qr-u1-123.png",
      "BASE64DATA",
      { encoding: "base64" },
    );
    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("buildQrImageUriFromRef returns null on timeout and alerts", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const qrRef: any = {
      current: {
        toDataURL: (_cb: (data: string) => void) => {
          // never calls back
        },
      },
    };

    const promise = buildQrImageUriFromRef(qrRef, "u1");
    jest.advanceTimersByTime(3100);
    const uri = await promise;
    expect(uri).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Failed to generate QR image (timeout).",
    );

    alertSpy.mockRestore();
  });

  it("buildQrImageUriFromRef returns null when cacheDirectory is missing", async () => {
    jest.resetModules();
    jest.doMock("expo-file-system", () => ({
      cacheDirectory: null,
      writeAsStringAsync: jest.fn(async () => null),
      deleteAsync: jest.fn(async () => null),
    }));

    const {
      buildQrImageUriFromRef: buildWithMissingCache,
    } = require("@/utils/add/addHelpers");

    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const qrRef: any = {
      current: {
        toDataURL: (cb: (data: string) => void) => cb("BASE64DATA"),
      },
    };

    const uri = await buildWithMissingCache(qrRef, "u1");
    expect(uri).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      "Unavailable",
      "File system is not available on this device.",
    );

    alertSpy.mockRestore();
  });

  it("cleanupSharedFile tolerates delete errors", async () => {
    (FileSystem.deleteAsync as jest.Mock).mockRejectedValueOnce(
      new Error("boom"),
    );

    cleanupSharedFile("file:///cache/x.png");
    await Promise.resolve();

    expect(reportError).toHaveBeenCalled();
  });
});
