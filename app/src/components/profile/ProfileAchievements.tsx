import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeIcon } from '@/components/features/BadgeIcon';
import { spacing, typography, colors } from '@/lib/theme';
import type { Achievement } from '@/services/supabase';

interface ProfileAchievementsProps {
    achievements: Achievement[];
}

export function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
    return (
        <View style={styles.badgeGrid}>
            {achievements.length > 0 ? (
                achievements.map((ach) => (
                    <View key={ach.id} style={styles.badgeItem}>
                        <BadgeIcon type={ach.badge_type} size={60} />
                        <Text style={styles.badgeName}>{ach.badge_type.replace(/_/g, ' ')}</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No badges yet. Start drinking! 🍻</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    badgeName: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
});
