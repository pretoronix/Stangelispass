import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors, spacing, borderRadius, typography } from "@/lib/theme";
import type { User } from "@/services/supabase";
import type { LifetimePassCode } from "@/services/lifetimePass";
import { labels } from "@/ui/labels";

interface LifetimePassSectionProps {
  isAdmin: boolean;
  currentUser: User | null;
  users: User[];
  codes: LifetimePassCode[];
  loading: boolean;
  generating: boolean;
  redeeming: boolean;
  redeemCode: string;
  setRedeemCode: (code: string) => void;
  onGenerateCode: () => void;
  onRedeemCode: () => void;
  onRefresh: () => void;
}

const resolveUserName = (users: User[], userId?: string | null) => {
  if (!userId) return "Unknown";
  return users.find((u) => u.id === userId)?.name || "Unknown";
};

export const LifetimePassSection: React.FC<LifetimePassSectionProps> = ({
  isAdmin,
  currentUser,
  users,
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
      <Text style={styles.title}>Lifetime Pass Codes</Text>
      <Text style={styles.subtitle}>
        Owners can generate codes. Colleagues can redeem them for lifetime
        access.
      </Text>

      {isAdmin && (
        <View style={styles.adminArea}>
          <Button
            title={generating ? "Generating..." : "Generate Code"}
            onPress={onGenerateCode}
            disabled={generating || !currentUser}
            testID={labels.settings.lifetimeGenerate.testID}
            accessibilityLabel={
              labels.settings.lifetimeGenerate.accessibilityLabel
            }
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
                        ? `Redeemed by ${resolveUserName(users, code.redeemed_by)}`
                        : "Available"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No codes generated yet.</Text>
          )}
        </View>
      )}

      <View style={styles.redeemArea}>
        <Text style={styles.redeemLabel}>Redeem Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter lifetime pass code..."
          placeholderTextColor={colors.textMuted}
          value={redeemCode}
          onChangeText={setRedeemCode}
          autoCapitalize="characters"
        />
        <Button
          title={redeeming ? "Redeeming..." : "Redeem Lifetime Pass"}
          onPress={onRedeemCode}
          disabled={redeeming || !currentUser}
          testID={labels.settings.lifetimeRedeem.testID}
          accessibilityLabel={labels.settings.lifetimeRedeem.accessibilityLabel}
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
