import { Platform } from "react-native";

export type IapProduct = "event_day" | "event_weekend" | "lifetime";

export const IAP_PRODUCT_IDS: Record<IapProduct, string> = {
  event_day: "stangelispass.event_day",
  event_weekend: "stangelispass.event_weekend",
  lifetime: "stangelispass.lifetime",
};

export const isIapAvailable = () => Platform.OS !== "web";

/**
 * Placeholder IAP implementation.
 *
 * The repository currently does not ship with a working in-app-purchase dependency.
 * Keep this module dependency-free so Metro can bundle the app without requiring
 * `expo-in-app-purchases`.
 *
 * When you decide on an IAP solution (Expo IAP, RevenueCat, Stripe, etc.), replace
 * these stubs with a real implementation.
 */
export const getProducts = async () => {
  if (!isIapAvailable()) {
    throw new Error("In-app purchases are not supported on web.");
  }
  throw new Error(
    "In-app purchases are not configured yet (no IAP provider installed).",
  );
};

export const purchaseProduct = async (_product: IapProduct) => {
  if (!isIapAvailable()) {
    throw new Error("In-app purchases are not supported on web.");
  }
  throw new Error(
    "In-app purchases are not configured yet (no IAP provider installed).",
  );
};

export const finishPurchase = async (_purchase: unknown, _success = true) => {
  return;
};
