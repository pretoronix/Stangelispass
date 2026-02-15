import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/lib/theme";
import { User } from "@/services/supabase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PremiumTierCardProps {
  subscriptionTier?: User["subscription_tier"];
  lifetimePass?: boolean;
  freeCredits?: number;
  dayCredits?: number;
  weekendCredits?: number;
  onBuyDayPass: () => void;
  onBuyWeekendPass: () => void;
  onBuyLifetime: () => void;
}

export const PremiumTierCard: React.FC<PremiumTierCardProps> = ({
  subscriptionTier,
  lifetimePass,
  freeCredits = 0,
  dayCredits = 0,
  weekendCredits = 0,
  onBuyDayPass,
  onBuyWeekendPass,
  onBuyLifetime,
}) => {
  const isLifetime = lifetimePass || subscriptionTier === "lifetime";
  const isCraft = subscriptionTier === "craft";
  const tierLabel = isLifetime
    ? "Supporter (Lifetime)"
    : isCraft
      ? "Craft (Premium)"
      : "Pilsner (Free)";
  const tierIcon = isLifetime ? "infinite" : isCraft ? "star" : "beer-outline";

  return (
    <Card style={styles.premiumCard}>
      <View style={styles.premiumHeader}>
        <View>
          <Text style={styles.premiumLabel}>Current Tier</Text>
          <Text style={styles.premiumTitle}>{tierLabel}</Text>
        </View>
        <Ionicons name={tierIcon as any} size={32} color={colors.primary} />
      </View>

      <View style={styles.creditRow}>
        <View style={styles.creditItem}>
          <Text style={styles.creditLabel}>Free Events</Text>
          <Text style={styles.creditValue}>{freeCredits}</Text>
        </View>
        <View style={styles.creditItem}>
          <Text style={styles.creditLabel}>Day Passes</Text>
          <Text style={styles.creditValue}>{dayCredits}</Text>
        </View>
        <View style={styles.creditItem}>
          <Text style={styles.creditLabel}>Weekend Passes</Text>
          <Text style={styles.creditValue}>{weekendCredits}</Text>
        </View>
      </View>

      {!isLifetime && (
        <>
          <Button
            title="Buy Day Pass (CHF 10)"
            onPress={onBuyDayPass}
            style={styles.upgradeButton}
          />
          <Button
            title="Buy Weekend Pass (CHF 15)"
            onPress={onBuyWeekendPass}
            variant="ghost"
            style={styles.supporterButton}
          />
          <Button
            title="Become a Supporter (Lifetime)"
            variant="ghost"
            onPress={onBuyLifetime}
            style={styles.supporterButton}
          />
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + "40",
  },
  premiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  creditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceLight,
  },
  creditItem: {
    alignItems: "center",
    flex: 1,
  },
  creditLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  creditValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 4,
  },
  premiumLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  premiumTitle: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "bold",
    marginTop: 2,
  },
  upgradeButton: {
    height: 44,
  },
  supporterButton: {
    height: 44,
    marginTop: spacing.sm,
  },
});
