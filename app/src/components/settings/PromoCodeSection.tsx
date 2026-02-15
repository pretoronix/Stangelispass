import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import type { User } from "@/services/supabase";
import type { PromoCode, PromoCodeType } from "@/services/promoCodes";

interface PromoCodeSectionProps {
  isAdmin: boolean;
  currentUser: User | null;
  codes: PromoCode[];
  loading: boolean;
  generating: boolean;
  redeeming: boolean;
  redeemCode: string;
  setRedeemCode: (code: string) => void;
  onGenerateCode: (type: PromoCodeType) => void;
  onRedeemCode: () => void;
  onRefresh: () => void;
}

export const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  isAdmin,
  currentUser,
  codes,
  loading,
  generating,
  redeeming,
  redeemCode,
  setRedeemCode,
  onGenerateCode,
  onRedeemCode,
  onRefresh,
}) => {
  return (
    <Card>
      <Text style={styles.title}>Promo Codes</Text>
      <Text style={styles.subtitle}>
        Generate day or weekend event passes for promotions.
      </Text>

      {isAdmin && (
        <View style={styles.adminArea}>
          <Button
            title={generating ? "Generating..." : "Generate Day Pass Code"}
            onPress={() => onGenerateCode("event_day")}
            disabled={generating || !currentUser}
            style={styles.actionButton}
          />
          <Button
            title={generating ? "Generating..." : "Generate Weekend Pass Code"}
            onPress={() => onGenerateCode("event_weekend")}
            disabled={generating || !currentUser}
            variant="ghost"
            style={styles.actionButton}
          />
          <Button
            title={loading ? "Refreshing..." : "Refresh Codes"}
            variant="ghost"
            onPress={onRefresh}
            disabled={loading}
            style={styles.actionButton}
          />
          {codes.length > 0 ? (
            <View style={styles.codeList}>
              {codes.slice(0, 6).map((code) => (
                <View key={code.id} style={styles.codeRow}>
                  <View style={styles.codeMeta}>
                    <Text style={styles.codeText}>{code.code}</Text>
                    <Text style={styles.codeStatus}>
                      {code.redeemed_at
                        ? "Redeemed"
                        : code.type.replace("event_", "")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No promo codes generated yet.</Text>
          )}
        </View>
      )}

      <View style={styles.redeemArea}>
        <Text style={styles.redeemLabel}>Redeem Promo Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter promo code..."
          placeholderTextColor={colors.textMuted}
          value={redeemCode}
          onChangeText={setRedeemCode}
          autoCapitalize="characters"
        />
        <Button
          title={redeeming ? "Redeeming..." : "Redeem Code"}
          onPress={onRedeemCode}
          disabled={redeeming || !currentUser}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  adminArea: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    height: 44,
    marginBottom: spacing.sm,
  },
  codeList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  codeRow: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  codeMeta: {
    gap: 4,
  },
  codeText: {
    ...typography.headline,
    fontSize: 16,
  },
  codeStatus: {
    ...typography.small,
    color: colors.textMuted,
  },
  emptyText: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  redeemArea: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    paddingTop: spacing.md,
  },
  redeemLabel: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 17,
    marginBottom: spacing.md,
  },
});
