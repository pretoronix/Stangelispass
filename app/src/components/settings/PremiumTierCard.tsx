import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/lib/theme';
import { User } from '@/services/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PremiumTierCardProps {
    subscriptionTier?: User['subscription_tier'];
    lifetimePass?: boolean;
}

export const PremiumTierCard: React.FC<PremiumTierCardProps> = ({ subscriptionTier, lifetimePass }) => {
    const isLifetime = lifetimePass || subscriptionTier === 'lifetime';
    const isCraft = subscriptionTier === 'craft';
    const tierLabel = isLifetime ? 'Lifetime (Owner)' : isCraft ? 'Craft (Premium)' : 'Pilsner (Free)';
    const tierIcon = isLifetime ? 'infinite' : isCraft ? 'star' : 'beer-outline';

    return (
        <Card style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
                <View>
                    <Text style={styles.premiumLabel}>Current Tier</Text>
                    <Text style={styles.premiumTitle}>{tierLabel}</Text>
                </View>
                <Ionicons
                    name={tierIcon as any}
                    size={32}
                    color={colors.primary}
                />
            </View>

            {!isCraft && !isLifetime && (
                <Button
                    title="Upgrade to Craft"
                    onPress={() => Alert.alert('Premium Access', 'This will soon redirect you to Stripe/Apple Pay to unlock unlimited squads and personal heatmaps! 🍻')}
                    style={styles.upgradeButton}
                />
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    premiumCard: {
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    premiumLabel: {
        fontSize: 13,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    premiumTitle: {
        fontSize: 18,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 2,
    },
    upgradeButton: {
        height: 44,
    },
});
