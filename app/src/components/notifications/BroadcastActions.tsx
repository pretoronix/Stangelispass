import React from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { broadcastModalStyles as styles } from "@/components/notifications/broadcastModalStyles";

type BroadcastActionsProps = {
  isPending: boolean;
  canSend: boolean;
  onCancel: () => void;
  onSend: () => void;
};

export function BroadcastActions({
  isPending,
  canSend,
  onCancel,
  onSend,
}: BroadcastActionsProps) {
  return (
    <View style={styles.actions}>
      <Button
        title="Cancel"
        variant="ghost"
        onPress={onCancel}
        disabled={isPending}
        style={styles.actionButton}
        testID="broadcast-cancel-button"
      />
      <Button
        title={isPending ? "Sending..." : "Send"}
        onPress={onSend}
        disabled={!canSend || isPending}
        style={styles.actionButton}
        testID="broadcast-send-button"
      />
    </View>
  );
}
