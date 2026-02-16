import { parseScanPayload } from "../scanPayload";
import { QR_ACTIONS, QR_PAYLOAD_VERSION } from "../../constants/qr";

describe("scanPayload (utils)", () => {
  describe("parseScanPayload", () => {
    it("returns unknown for empty or non-string input", () => {
      expect(parseScanPayload("")).toEqual({ type: "unknown" });
      expect(parseScanPayload(null as any)).toEqual({ type: "unknown" });
    });

    it("parses legacy pipe-separated payloads", () => {
      const userId = "a12345678";
      const eventId = "b12345678";
      expect(parseScanPayload(`${userId}|${eventId}`)).toEqual({
        type: "beer_log",
        userId,
        eventId,
      });
    });

    it("parses legacy JSON beer_log payloads without type", () => {
      const payload = JSON.stringify({
        userId: "a12345678",
        eventId: "b12345678",
      });
      expect(parseScanPayload(payload)).toEqual({
        type: "beer_log",
        userId: "a12345678",
        eventId: "b12345678",
      });
    });

    it("parses versioned JOIN_EVENT payloads", () => {
      const payload = JSON.stringify({
        type: QR_ACTIONS.JOIN_EVENT,
        eventId: "b12345678",
        eventName: "Party",
        v: QR_PAYLOAD_VERSION,
      });
      expect(parseScanPayload(payload)).toEqual({
        type: "join_event",
        eventId: "b12345678",
        eventName: "Party",
        version: QR_PAYLOAD_VERSION,
      });
    });

    it("parses versioned STAMP_BEER payloads (stampId)", () => {
      const payload = JSON.stringify({
        type: QR_ACTIONS.STAMP_BEER,
        stampId: "c12345678",
        v: QR_PAYLOAD_VERSION,
      });
      expect(parseScanPayload(payload)).toEqual({
        type: "stamp_redeem",
        stampId: "c12345678",
        version: QR_PAYLOAD_VERSION,
      });
    });

    it("parses versioned STAMP_BEER payloads (userId)", () => {
      const payload = JSON.stringify({
        type: QR_ACTIONS.STAMP_BEER,
        userId: "a12345678",
        eventId: "b12345678",
        v: QR_PAYLOAD_VERSION,
      });
      expect(parseScanPayload(payload)).toEqual({
        type: "beer_log",
        userId: "a12345678",
        eventId: "b12345678",
        version: QR_PAYLOAD_VERSION,
      });
    });

    it("parses PARTICIPANT_LOG payloads", () => {
      const payload = JSON.stringify({
        type: QR_ACTIONS.PARTICIPANT_LOG,
        userId: "a12345678",
        eventId: "b12345678",
        v: QR_PAYLOAD_VERSION,
      });
      expect(parseScanPayload(payload)).toEqual({
        type: "beer_log",
        userId: "a12345678",
        eventId: "b12345678",
        version: QR_PAYLOAD_VERSION,
      });
    });

    it("handles malformed JSON and falls back", () => {
      expect(parseScanPayload("not-json")).toEqual({ type: "unknown" });
      expect(parseScanPayload('{"incomplete":')).toEqual({ type: "unknown" });
    });

    it("rejects invalid IDs in JSON", () => {
      const payload = JSON.stringify({ userId: "short", eventId: "short" });
      expect(parseScanPayload(payload)).toEqual({ type: "unknown" });
    });

    it("rejects PARTICIPANT_LOG payloads with missing ids", () => {
      expect(
        parseScanPayload(
          JSON.stringify({
            type: QR_ACTIONS.PARTICIPANT_LOG,
            userId: "a12345678",
          }),
        ),
      ).toEqual({ type: "unknown" });

      expect(
        parseScanPayload(
          JSON.stringify({
            type: QR_ACTIONS.PARTICIPANT_LOG,
            eventId: "b12345678",
          }),
        ),
      ).toEqual({ type: "unknown" });
    });
  });
});
