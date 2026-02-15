import { captureAndShareCard, captureView } from "@/utils/shareImage";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { Alert } from "react-native";

jest.mock("expo-media-library");
jest.mock("expo-sharing");
jest.mock("react-native-view-shot");

// Spy on Alert.alert
const mockAlert = jest.spyOn(Alert, "alert");

describe("shareImage", () => {
  const mockViewRef = {
    current: { mock: "view" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("captureAndShareCard", () => {
    it("should capture and share image successfully", async () => {
      const mockUri = "file://test-image.png";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await captureAndShareCard(mockViewRef as any, {
        eventName: "Test Event",
      });

      expect(result.success).toBe(true);
      expect(result.uri).toBe(mockUri);
      expect(captureRef).toHaveBeenCalledWith(mockViewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      expect(Sharing.shareAsync).toHaveBeenCalledWith(mockUri, {
        mimeType: "image/png",
        dialogTitle: "Share Test Event Results",
      });
    });

    it("should save to library when requested", async () => {
      const mockUri = "file://test-image.png";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue(
        undefined,
      );
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await captureAndShareCard(mockViewRef as any, {
        eventName: "Test Event",
        saveToLibrary: true,
      });

      expect(result.success).toBe(true);
      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(mockUri);
      expect(mockAlert).toHaveBeenCalledWith(
        "Saved!",
        "Your Brewmaster card has been saved to your photos.",
        [{ text: "OK" }],
      );
    });

    it("should handle permission denial for saving", async () => {
      const mockUri = "file://test-image.png";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await captureAndShareCard(mockViewRef as any, {
        eventName: "Test Event",
        saveToLibrary: true,
      });

      expect(result.success).toBe(true);
      expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(
        "Permission Denied",
        expect.any(String),
        [{ text: "OK" }],
      );
    });

    it("should handle null view reference", async () => {
      const nullRef = { current: null };

      const result = await captureAndShareCard(nullRef as any, {
        eventName: "Test Event",
      });

      expect(result.success).toBe(false);
      expect(result.uri).toBeUndefined();
      expect(mockAlert).toHaveBeenCalledWith("Error", expect.any(String));
    });

    it("should handle sharing not available", async () => {
      const mockUri = "file://test-image.png";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const result = await captureAndShareCard(mockViewRef as any, {
        eventName: "Test Event",
      });

      expect(result.success).toBe(true);
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(
        "Sharing Not Available",
        expect.any(String),
        [{ text: "OK" }],
      );
    });

    it("should handle capture errors", async () => {
      (captureRef as jest.Mock).mockRejectedValue(new Error("Capture failed"));

      const result = await captureAndShareCard(mockViewRef as any, {
        eventName: "Test Event",
      });

      expect(result.success).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith("Error", expect.any(String));
    });
  });

  describe("captureView", () => {
    it("should capture view successfully with default options", async () => {
      const mockUri = "file://test-image.png";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);

      const result = await captureView(mockViewRef as any);

      expect(result).toBe(mockUri);
      expect(captureRef).toHaveBeenCalledWith(mockViewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
    });

    it("should capture view with custom options", async () => {
      const mockUri = "file://test-image.jpg";

      (captureRef as jest.Mock).mockResolvedValue(mockUri);

      const result = await captureView(mockViewRef as any, {
        format: "jpg",
        quality: 0.8,
      });

      expect(result).toBe(mockUri);
      expect(captureRef).toHaveBeenCalledWith(mockViewRef, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile",
      });
    });

    it("should return null on error", async () => {
      (captureRef as jest.Mock).mockRejectedValue(new Error("Capture failed"));

      const result = await captureView(mockViewRef as any);

      expect(result).toBeNull();
    });

    it("should handle null view reference", async () => {
      const nullRef = { current: null };

      const result = await captureView(nullRef as any);

      expect(result).toBeNull();
    });
  });
});
