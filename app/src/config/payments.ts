export type PaymentsMode = "ui_only" | "enabled";

const rawMode =
  (process?.env?.EXPO_PUBLIC_PAYMENTS_MODE || "").trim().toLowerCase() || "";

export const PAYMENTS_MODE: PaymentsMode =
  rawMode === "enabled" ? "enabled" : "ui_only";

export const isPaymentsUiOnly = () => PAYMENTS_MODE === "ui_only";
