import { Platform } from "react-native";

export type IapProduct = "event_day" | "event_weekend" | "lifetime";

export const IAP_PRODUCT_IDS: Record<IapProduct, string> = {
  event_day: "stangelispass.event_day",
  event_weekend: "stangelispass.event_weekend",
  lifetime: "stangelispass.lifetime",
};

/**
 * Master feature flag for in-app purchases.
 *
 * In-app purchases are deliberately deferred to v1.1. For the v1.0 App Store
 * submission no purchase provider is wired up, so every purchase entry point in
 * the UI must stay unreachable — a visibly broken purchase flow is an App Store
 * rejection under Guideline 2.1.
 *
 * The purchase code paths below are intentionally kept (not deleted) so v1.1 can
 * flip this flag to `true` once a real provider (Expo IAP, RevenueCat, Stripe,
 * ...) is integrated and the stubs are replaced with a real implementation.
 */
export const IAP_ENABLED = false;

/**
 * Human-readable hint shown when a user runs out of event credits.
 * While IAP is disabled the only way to obtain credits is a promo code.
 */
export const NO_EVENT_CREDITS_MESSAGE = IAP_ENABLED
  ? "No event passes available. Purchase a day or weekend pass in Settings."
  : "No event passes available. Redeem a promo code in Settings to unlock an event.";

export const isIapAvailable = () => IAP_ENABLED && Platform.OS !== "web";

/**
 * Placeholder IAP implementation.
 *
 * The repository currently does not ship with a working in-app-purchase dependency.
 * Keep this module dependency-free so Metro can bundle the app without requiring
 * a native IAP module.
 *
 * These stubs are only reachable once `IAP_ENABLED` is flipped to `true`.
 */
const unavailableError = () =>
  new Error(
    !IAP_ENABLED
      ? "In-app purchases are disabled in this release (planned for v1.1)."
      : Platform.OS === "web"
        ? "In-app purchases are not supported on web."
        : "In-app purchases are not configured yet (no IAP provider installed).",
  );

export const getProducts = async () => {
  throw unavailableError();
};

export const purchaseProduct = async (_product: IapProduct) => {
  throw unavailableError();
};

export const finishPurchase = async (_purchase: unknown, _success = true) => {
  return;
};
