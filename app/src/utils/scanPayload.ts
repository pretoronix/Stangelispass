import { QR_ACTIONS } from "@/constants/qr";

export type ParsedScanPayload =
  | {
      type: "join_event";
      eventId?: string;
      eventName?: string;
      version?: number;
    }
  | { type: "stamp_redeem"; stampId: string; version?: number }
  | { type: "beer_log"; userId: string; eventId?: string; version?: number }
  | { type: "unknown" };

const MAX_QR_PAYLOAD_LENGTH = 2048;

const isLikelyId = (value: string | undefined) => {
  if (!value) return false;
  // Accept UUIDs and local sentinel IDs used by offline fallback.
  return /^[0-9a-fA-F-]{8,}$/.test(value) || value === "local";
};

const isLikelyStampId = (value: string | undefined) => {
  if (!value) return false;
  return /^[0-9a-fA-F-]{8,}$/.test(value);
};

export function parseScanPayload(raw: string): ParsedScanPayload {
  if (!raw || typeof raw !== "string") {
    return { type: "unknown" };
  }
  if (raw.length > MAX_QR_PAYLOAD_LENGTH) {
    return { type: "unknown" };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { type: "unknown" };

    const version = typeof parsed.v === "number" ? parsed.v : undefined;

    if (parsed.type === QR_ACTIONS.JOIN_EVENT) {
      return {
        type: "join_event",
        eventId:
          typeof parsed.eventId === "string" ? parsed.eventId : undefined,
        eventName:
          typeof parsed.eventName === "string" ? parsed.eventName : undefined,
        version,
      };
    }

    // Newer versioned or standard STAMP_BEER payload
    if (parsed.type === QR_ACTIONS.STAMP_BEER) {
      // Case 1: Pre-generated stamp for redemption
      if (typeof parsed.stampId === "string") {
        const stampId = parsed.stampId.trim();
        if (!isLikelyStampId(stampId)) return { type: "unknown" };
        return { type: "stamp_redeem", stampId, version };
      }

      // Case 2: Logging a beer for a user
      if (typeof parsed.userId === "string") {
        const userId = parsed.userId.trim();
        const eventId =
          typeof parsed.eventId === "string"
            ? parsed.eventId.trim()
            : undefined;
        if (!isLikelyId(userId)) return { type: "unknown" };
        if (eventId && !isLikelyId(eventId)) return { type: "unknown" };
        return { type: "beer_log", userId, eventId, version };
      }
    }

    if (parsed.type === QR_ACTIONS.PARTICIPANT_LOG) {
      if (
        typeof parsed.userId !== "string" ||
        typeof parsed.eventId !== "string"
      ) {
        return { type: "unknown" };
      }
      const userId = parsed.userId.trim();
      const eventId = parsed.eventId.trim();
      if (!isLikelyId(userId) || !isLikelyId(eventId)) {
        return { type: "unknown" };
      }
      return { type: "beer_log", userId, eventId, version };
    }

    if (typeof parsed.type === "string") {
      return { type: "unknown" };
    }

    // Legacy/Implicit beer log payload (no type field, just userId/eventId)
    if (typeof parsed.userId === "string") {
      const userId = parsed.userId.trim();
      const eventId =
        typeof parsed.eventId === "string" ? parsed.eventId.trim() : undefined;
      if (isLikelyId(userId)) {
        return { type: "beer_log", userId, eventId, version };
      }
    }
  } catch (_err) {
    // Fall through to legacy pipe-separated payload parsing.
  }

  // Legacy format: userId|eventId
  if (raw.includes("|")) {
    const [userId, eventId] = raw.split("|");
    const trimmedUserId = userId?.trim();
    if (trimmedUserId && isLikelyId(trimmedUserId)) {
      const trimmedEventId = eventId?.trim();
      const safeEventId =
        trimmedEventId && trimmedEventId.length > 0
          ? trimmedEventId
          : undefined;
      if (safeEventId && !isLikelyId(safeEventId)) return { type: "unknown" };
      return {
        type: "beer_log",
        userId: trimmedUserId,
        eventId: safeEventId,
      };
    }
  }

  return { type: "unknown" };
}
