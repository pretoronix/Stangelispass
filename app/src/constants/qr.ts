export const QR_PAYLOAD_VERSION = 1;

export const QR_ACTIONS = {
  STAMP_BEER: "STAMP_BEER",
  JOIN_EVENT: "JOIN_EVENT",
  PARTICIPANT_LOG: "PARTICIPANT_LOG",
} as const;

export type QRPayloadAction = (typeof QR_ACTIONS)[keyof typeof QR_ACTIONS];
