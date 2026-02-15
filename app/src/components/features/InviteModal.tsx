import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
}

export const InviteModal = ({
  visible,
  onClose,
  eventId,
  eventName,
}: InviteModalProps) => {
  // Encodes the join data. In a real app, this would be a deep link.
  const joinData = JSON.stringify({
    type: "JOIN_EVENT",
    eventId,
    eventName,
    expire: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours validity
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.title}>Invite a Friend</Text>
          <Text style={styles.subtitle}>
            Let them scan this to join "{eventName}"
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={joinData}
              size={200}
              color={colors.primary}
              backgroundColor="transparent"
            />
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={colors.success}
            />
            <Text style={styles.secureText}>Secure Peer-to-Peer Invite</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: "#FFF", // White BG for the QR to be scannable
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secureText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
