import { useState } from "react";
import { Alert } from "react-native";
import { addUser, joinEvent as joinEventService } from "@/services/supabase";
import type { User } from "@/services/types";
import { reportError } from "@/utils/logger";
import { copy } from "@/ui/copy";

type PendingAction = "start_round" | "join_event";

export function useEventActions(
  setCurrentUser: (user: User | null) => void,
  startEvent: (
    name: string,
    passType: string,
    beerPrice?: number,
  ) => Promise<void>,
  refresh: () => void,
) {
  const [showStartRoundPrompt, setShowStartRoundPrompt] = useState(false);
  const [startRoundName, setStartRoundName] = useState("");
  const [beerPrice, setBeerPrice] = useState("5.00");
  const [pendingAction, setPendingAction] =
    useState<PendingAction>("start_round");
  const [pendingJoinEventName, setPendingJoinEventName] = useState("");
  const [pendingJoinEventId, setPendingJoinEventId] = useState<
    string | undefined
  >(undefined);
  const [promptSubmitting, setPromptSubmitting] = useState(false);

  const openNamePrompt = (
    action: PendingAction,
    joinEventName?: string,
    joinEventId?: string,
  ) => {
    setPendingAction(action);
    setPendingJoinEventName(joinEventName || "");
    setPendingJoinEventId(joinEventId);
    setStartRoundName("");
    setBeerPrice("5.00");
    setShowStartRoundPrompt(true);
  };

  const submitNamePrompt = async () => {
    const cleanName = startRoundName.trim();
    if (!cleanName || promptSubmitting) return;

    setPromptSubmitting(true);
    try {
      const user = await addUser(cleanName, pendingAction === "start_round");
      if (!user) {
        Alert.alert(copy.common.error, copy.home.alerts.couldNotCreateUser);
        return;
      }

      setCurrentUser(user);
      if (pendingAction === "start_round") {
        if (!user.is_admin) {
          Alert.alert(copy.home.alerts.adminRequired, copy.home.alerts.adminOnlyStartRound);
          return;
        }
        const parsedPrice = parseFloat(beerPrice);
        const price = Number.isFinite(parsedPrice) ? parsedPrice : 5.0;
        if (price <= 0) {
          Alert.alert(copy.home.alerts.invalidPrice, copy.home.alerts.priceMustBePositive);
          return;
        }
        await startEvent("Night Out", "day", price);
      } else {
        if (pendingJoinEventId) {
          await joinEventService(pendingJoinEventId, user.id).catch((e) => {
            reportError(new Error("Failed to join event membership"), {
              scope: "useEventActions",
              action: "join_event",
              metadata: { cause: e instanceof Error ? e.message : String(e) },
            });
          });
        }
        Alert.alert(
          copy.home.alerts.joined,
          `You are now part of ${pendingJoinEventName || "the round"}.`,
        );
      }

      setShowStartRoundPrompt(false);
      setStartRoundName("");
      setBeerPrice("5.00");
      refresh();
    } catch (e) {
      reportError(new Error("Failed to complete action after creating user"), {
        scope: "useEventActions",
        action: "submit_name_prompt",
        metadata: { cause: e instanceof Error ? e.message : String(e) },
      });
      Alert.alert(copy.common.error, copy.home.alerts.actionFailed);
    } finally {
      setPromptSubmitting(false);
    }
  };

  return {
    showStartRoundPrompt,
    setShowStartRoundPrompt,
    startRoundName,
    setStartRoundName,
    beerPrice,
    setBeerPrice,
    pendingAction,
    pendingJoinEventName,
    promptSubmitting,
    openNamePrompt,
    submitNamePrompt,
  };
}
