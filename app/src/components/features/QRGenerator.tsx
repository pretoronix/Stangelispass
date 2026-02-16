import React from "react";
import { View, StyleSheet, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import { QR_ACTIONS, QR_PAYLOAD_VERSION } from "@/constants/qr";

interface QRGeneratorProps {
  userId: string;
  userName: string;
  eventName?: string;
  participantName?: string;
  eventId?: string;
  stampId?: string;
  mode?: "stamp" | "log" | "participant_log";
  onQrRef?: (ref: any) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  userId,
  userName,
  eventName,
  participantName,
  eventId,
  stampId,
  mode = "stamp",
  onQrRef,
}) => {
  const payloadObject =
    mode === "participant_log"
      ? {
          type: QR_ACTIONS.PARTICIPANT_LOG,
          eventId: eventId || "",
          userId,
          v: QR_PAYLOAD_VERSION,
        }
      : mode === "log"
        ? {
            type: QR_ACTIONS.JOIN_EVENT,
            eventId: eventId || "",
            eventName: userName,
            v: QR_PAYLOAD_VERSION,
          }
        : stampId
          ? { type: QR_ACTIONS.STAMP_BEER, stampId, v: QR_PAYLOAD_VERSION }
          : {
              type: QR_ACTIONS.STAMP_BEER,
              userId,
              eventId: eventId || "",
              v: QR_PAYLOAD_VERSION,
            };

  const payload = JSON.stringify(payloadObject);

  const displayName = participantName || userName;
  const displayEventName = eventName || "";
  const labelText =
    mode === "participant_log"
      ? `${displayName} — ${displayEventName}`
      : mode === "log"
        ? `Scan to join ${userName}'s round`
        : `Stamp +1 beer for ${userName}`;
  const hintText =
    mode === "participant_log"
      ? "Organizer scans to log a beer"
      : mode === "log"
        ? "Others scan this to participate in your round"
        : "Show this to the participant to claim one beer";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{labelText}</Text>
      <View style={styles.qrWrapper}>
        <QRCode
          value={payload}
          size={200}
          color={colors.textPrimary}
          backgroundColor={colors.surface}
          quietZone={8}
          getRef={onQrRef}
        />
      </View>
      <Text style={styles.hint}>{hintText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  label: {
    ...typography.headline,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: "#FFFFFF", // High contrast for scanner
    borderRadius: borderRadius.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
