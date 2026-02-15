import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSendBroadcast } from "@/hooks/useNotificationsQuery";
import { BroadcastMessageInput } from "@/components/notifications/BroadcastMessageInput";
import { BroadcastActions } from "@/components/notifications/BroadcastActions";
import { broadcastModalStyles as styles } from "@/components/notifications/broadcastModalStyles";
import { colors } from "@/lib/theme";

interface BroadcastModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  senderId: string;
  eventName: string;
}

const MAX_MESSAGE_LENGTH = 100;

export function BroadcastModal({
  visible,
  onClose,
  eventId,
  senderId,
  eventName,
}: BroadcastModalProps) {
  const [message, setMessage] = useState("");
  const sendBroadcast = useSendBroadcast();

  const remainingChars = MAX_MESSAGE_LENGTH - message.length;
  const isValid = useMemo(
    () => message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH,
    [message],
  );

  const handleSend = useCallback(async () => {
    if (!isValid || sendBroadcast.isPending) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await sendBroadcast.mutateAsync({
        eventId,
        message: message.trim(),
        senderId,
      });

      if (result.success) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        Alert.alert(
          "Broadcast Sent! 📢",
          `Your message was sent to ${result.count} member${result.count !== 1 ? "s" : ""}.`,
          [{ text: "OK" }],
        );
        setMessage("");
        onClose();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Failed to Send",
          result.error || "Could not send broadcast. Please try again.",
          [{ text: "OK" }],
        );
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "An unexpected error occurred.", [
        { text: "OK" },
      ]);
    }
  }, [eventId, isValid, message, onClose, senderId, sendBroadcast]);

  const handleClose = useCallback(() => {
    if (message.trim() && !sendBroadcast.isPending) {
      Alert.alert("Discard Message?", "Your message will be lost.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setMessage("");
            onClose();
          },
        },
      ]);
    } else {
      setMessage("");
      onClose();
    }
  }, [message, onClose, sendBroadcast.isPending]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="megaphone" size={24} color={colors.primary} />
              <Text style={styles.title}>Broadcast to {eventName}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={sendBroadcast.isPending}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <BroadcastMessageInput
            message={message}
            onChangeMessage={setMessage}
            remainingChars={remainingChars}
            isPending={sendBroadcast.isPending}
          />

          <Text style={styles.helpText}>
            💡 This message will be sent to all active event members who haven't
            opted out.
          </Text>

          <BroadcastActions
            isPending={sendBroadcast.isPending}
            canSend={isValid}
            onCancel={handleClose}
            onSend={handleSend}
          />

          {sendBroadcast.isPending && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
