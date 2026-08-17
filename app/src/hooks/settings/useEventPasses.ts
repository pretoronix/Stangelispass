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
  IAP_ENABLED,
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
import { copy } from "@/ui/copy";

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
        Alert.alert(copy.common.notAuthorized, copy.settings.alerts.adminOnlyPromo);
        return;
      }
      setGenerating(true);
      try {
        const created = await createPromoCode(type, currentUser.id, 1);
        if (!created) {
          Alert.alert(
            copy.common.unavailable,
            copy.settings.alerts.promoCodesUnavailable,
          );
          return;
        }
        setPromoCodes((prev) => [created, ...prev]);
        Alert.alert(copy.settings.alerts.codeGenerated, `Share this code: ${created.code}`);
      } catch (e) {
        Alert.alert(copy.common.error, copy.settings.alerts.generatePromoFailed);
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
          copy.common.unavailable,
          copy.settings.alerts.eventCreditsUnavailable,
        );
        return;
      }
    },
    [currentUser, setCurrentUser],
  );

  const handleRedeemPromoCode = useCallback(async () => {
    if (!currentUser) {
      Alert.alert(
        copy.common.selectUser,
        copy.settings.alerts.selectUserBeforeRedeem,
      );
      return;
    }
    const trimmed = redeemCode.trim();
    if (!trimmed) {
      Alert.alert(copy.common.enterCode, copy.settings.alerts.enterPromoCode);
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
        Alert.alert(copy.settings.alerts.redeemFailed, message);
        return;
      }
      if (result.type) {
        await applyPromoReward(result.type, result.credits || 1);
      }
      await refreshUsers();
      setRedeemCode("");
      Alert.alert(copy.common.success, copy.settings.alerts.codeRedeemed);
    } catch (e) {
      Alert.alert(copy.common.error, copy.settings.alerts.redeemCodeFailed);
      reportError(e as Error, { scope: "event_passes", action: "redeem_code" });
    } finally {
      setRedeeming(false);
    }
  }, [applyPromoReward, currentUser, redeemCode, refreshUsers]);

  const handlePurchaseEventPass = useCallback(
    async (type: "day" | "weekend") => {
      // IAP is deferred to v1.1. The UI never exposes this handler while the
      // flag is off; the guard makes the dead path unreachable for good.
      if (!IAP_ENABLED) return;
      if (!currentUser) {
        Alert.alert(copy.common.selectUser, copy.settings.alerts.selectUserBeforePurchase);
        return;
      }
      if (isPaymentsUiOnly()) {
        const price = type === "day" ? "CHF 10" : "CHF 15";
        Alert.alert(
          copy.settings.alerts.paymentPreview,
          `${type === "day" ? "Single Event Pass" : "Weekend Unlimited Pass"} — ${price}\n\nPayments are not enabled yet. This is the UI preview only.`,
        );
        return;
      }
      if (Platform.OS === "web") {
        Alert.alert(
          copy.common.unavailable,
          copy.settings.alerts.iapNotOnWeb,
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
            copy.common.unavailable,
            copy.settings.alerts.eventCreditsUnavailable,
          );
          return;
        }
        await refreshUsers();
        Alert.alert(copy.settings.alerts.purchaseComplete, copy.settings.alerts.eventPassAdded);
      } catch (e) {
        Alert.alert(copy.settings.alerts.purchaseFailed, copy.settings.alerts.purchaseIncomplete);
        reportError(e as Error, {
          scope: "event_passes",
          action: "purchase_pass",
        });
      }
    },
    [currentUser, refreshUsers],
  );

  const handlePurchaseLifetime = useCallback(async () => {
    // See handlePurchaseEventPass — unreachable while IAP_ENABLED is false.
    if (!IAP_ENABLED) return;
    if (!currentUser) {
      Alert.alert(copy.common.selectUser, copy.settings.alerts.selectUserBeforePurchase);
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
        copy.settings.alerts.supporterPreview,
        copy.settings.alerts.supporterPreviewHint,
      );
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert(copy.common.unavailable, copy.settings.alerts.iapNotOnWeb);
      return;
    }
    try {
      const purchase = await purchaseProduct("lifetime");
      await finishPurchase(purchase, true);
      await applyPromoReward("lifetime", 1);
      await refreshUsers();
      Alert.alert(copy.settings.alerts.supporterActivated, copy.settings.alerts.lifetimeUnlocked);
    } catch (e) {
      Alert.alert(copy.settings.alerts.purchaseFailed, copy.settings.alerts.purchaseIncomplete);
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
    iapEnabled: IAP_ENABLED,
    iapProductIds: IAP_PRODUCT_IDS,
  };
};
