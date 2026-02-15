import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import type { User } from "@/services/supabase";
import {
  consumeEventCredit,
  grantEventCredits,
  hasLifetimeAccess,
} from "@/services/eventPasses";
import {
  purchaseProduct,
  finishPurchase,
  IAP_PRODUCT_IDS,
} from "@/services/iap";
import {
  createPromoCode,
  listPromoCodes,
  redeemPromoCode,
  type PromoCode,
  type PromoCodeType,
} from "@/services/promoCodes";
import { updateUser } from "@/services/users";
import { reportError } from "@/utils/logger";
import { getEventPricingType } from "@/utils/eventPricing";
import { isPaymentsUiOnly } from "@/config/payments";

interface UseEventPassesProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshUsers: () => Promise<void>;
}

export const useEventPasses = ({
  currentUser,
  setCurrentUser,
  refreshUsers,
}: UseEventPassesProps) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refreshPromoCodes = useCallback(async () => {
    if (!currentUser?.is_admin) return;
    setLoadingCodes(true);
    try {
      const list = await listPromoCodes();
      setPromoCodes(list);
    } catch (e) {
      reportError(e as Error, { scope: "event_passes", action: "list_codes" });
    } finally {
      setLoadingCodes(false);
    }
  }, [currentUser?.is_admin]);

  useEffect(() => {
    refreshPromoCodes();
  }, [refreshPromoCodes]);

  const handleGeneratePromoCode = useCallback(
    async (type: PromoCodeType) => {
      if (!currentUser?.is_admin) {
        Alert.alert("Not Authorized", "Only admins can generate promo codes.");
        return;
      }
      setGenerating(true);
      try {
        const created = await createPromoCode(type, currentUser.id, 1);
        if (!created) {
          Alert.alert(
            "Unavailable",
            "Promo codes are not available until the database is ready.",
          );
          return;
        }
        setPromoCodes((prev) => [created, ...prev]);
        Alert.alert("Code Generated", `Share this code: ${created.code}`);
      } catch (e) {
        Alert.alert("Error", "Failed to generate promo code.");
        reportError(e as Error, {
          scope: "event_passes",
          action: "generate_code",
        });
      } finally {
        setGenerating(false);
      }
    },
    [currentUser],
  );

  const applyPromoReward = useCallback(
    async (type: PromoCodeType, credits = 1) => {
      if (!currentUser) return;
      if (type === "lifetime") {
        const updated = await updateUser(currentUser.id, {
          subscription_tier: "lifetime",
          lifetime_pass: true,
          lifetime_pass_granted_at: new Date().toISOString(),
        } as any);
        if (updated) setCurrentUser(updated as User);
        return;
      }

      const pricingType = type === "event_weekend" ? "weekend" : "day";
      const result = await grantEventCredits(
        currentUser.id,
        pricingType,
        credits,
      );
      if (result && !result.ok) {
        Alert.alert(
          "Unavailable",
          "Event credits are not available until the database is ready.",
        );
        return;
      }
    },
    [currentUser, setCurrentUser],
  );

  const handleRedeemPromoCode = useCallback(async () => {
    if (!currentUser) {
      Alert.alert(
        "Select User",
        "Please select a user before redeeming a code.",
      );
      return;
    }
    const trimmed = redeemCode.trim();
    if (!trimmed) {
      Alert.alert("Enter Code", "Please enter a promo code.");
      return;
    }
    setRedeeming(true);
    try {
      const result = await redeemPromoCode(trimmed, currentUser.id);
      if (!result.ok) {
        const message =
          result.reason === "already_redeemed"
            ? "This code has already been redeemed."
            : result.reason === "expired"
              ? "This code has expired."
              : result.reason === "codes_unavailable"
                ? "Promo codes are not available yet."
                : "Invalid code. Please check and try again.";
        Alert.alert("Redeem Failed", message);
        return;
      }
      if (result.type) {
        await applyPromoReward(result.type, result.credits || 1);
      }
      await refreshUsers();
      setRedeemCode("");
      Alert.alert("Success", "Code redeemed successfully.");
    } catch (e) {
      Alert.alert("Error", "Failed to redeem code.");
      reportError(e as Error, { scope: "event_passes", action: "redeem_code" });
    } finally {
      setRedeeming(false);
    }
  }, [applyPromoReward, currentUser, redeemCode, refreshUsers]);

  const handlePurchaseEventPass = useCallback(
    async (type: "day" | "weekend") => {
      if (!currentUser) {
        Alert.alert("Select User", "Please select a user before purchasing.");
        return;
      }
      if (isPaymentsUiOnly()) {
        const price = type === "day" ? "CHF 10" : "CHF 15";
        Alert.alert(
          "Payment (Preview)",
          `${type === "day" ? "Single Event Pass" : "Weekend Unlimited Pass"} — ${price}\n\nPayments are not enabled yet. This is the UI preview only.`,
        );
        return;
      }
      if (Platform.OS === "web") {
        Alert.alert(
          "Unavailable",
          "In-app purchases are not supported on web.",
        );
        return;
      }
      try {
        const product = type === "day" ? "event_day" : "event_weekend";
        const purchase = await purchaseProduct(product);
        await finishPurchase(purchase, true);
        const result = await grantEventCredits(currentUser.id, type, 1);
        if (result && !result.ok) {
          Alert.alert(
            "Unavailable",
            "Event credits are not available until the database is ready.",
          );
          return;
        }
        await refreshUsers();
        Alert.alert("Purchase Complete", "Event pass added to your account.");
      } catch (e) {
        Alert.alert("Purchase Failed", "Could not complete purchase.");
        reportError(e as Error, {
          scope: "event_passes",
          action: "purchase_pass",
        });
      }
    },
    [currentUser, refreshUsers],
  );

  const handlePurchaseLifetime = useCallback(async () => {
    if (!currentUser) {
      Alert.alert("Select User", "Please select a user before purchasing.");
      return;
    }
    if (isPaymentsUiOnly()) {
      // UI-only: mark supporter locally so the UI reflects it.
      setCurrentUser({
        ...(currentUser as any),
        subscription_tier: "lifetime",
        lifetime_pass: true,
      } as User);
      Alert.alert(
        "Supporter (Preview)",
        "Lifetime Supporter — CHF 100\n\nPayments are not enabled yet. This marks you as a supporter in the UI only.",
      );
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert("Unavailable", "In-app purchases are not supported on web.");
      return;
    }
    try {
      const purchase = await purchaseProduct("lifetime");
      await finishPurchase(purchase, true);
      await applyPromoReward("lifetime", 1);
      await refreshUsers();
      Alert.alert("Supporter Activated", "Lifetime access unlocked.");
    } catch (e) {
      Alert.alert("Purchase Failed", "Could not complete purchase.");
      reportError(e as Error, {
        scope: "event_passes",
        action: "purchase_lifetime",
      });
    }
  }, [applyPromoReward, currentUser, refreshUsers]);

  const handleConsumeForStart = useCallback(async () => {
    if (!currentUser) return { ok: false, reason: "no_user" as const };
    if (hasLifetimeAccess(currentUser))
      return { ok: true, used: "lifetime" as const };
    const pricingType = getEventPricingType(new Date());
    const result = await consumeEventCredit(currentUser.id, pricingType);
    return { ...result, pricingType };
  }, [currentUser]);

  return {
    promoCodes,
    loadingCodes,
    redeemCode,
    setRedeemCode,
    redeeming,
    generating,
    refreshPromoCodes,
    handleGeneratePromoCode,
    handleRedeemPromoCode,
    handlePurchaseEventPass,
    handlePurchaseLifetime,
    handleConsumeForStart,
    iapProductIds: IAP_PRODUCT_IDS,
  };
};
