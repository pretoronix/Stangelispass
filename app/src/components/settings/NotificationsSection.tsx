import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, spacing } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { NotificationPrefs } from '@/services/supabase';

interface NotificationsSectionProps {
    notificationPrefs: NotificationPrefs;
    milestones: readonly number[];
    onToggleLeaderChange: (value: boolean) => void;
    onToggleMilestone: (milestone: number, value: boolean) => void;
    onToggleAdminBroadcasts?: (value: boolean) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
    notificationPrefs,
    milestones,
    onToggleLeaderChange,
    onToggleMilestone,
    onToggleAdminBroadcasts,
}) => {
    return (
        <Card>
            <View style={styles.bioRow}>
                <Text style={styles.bioLabel}>Lead Change Alerts</Text>
                <Switch
                    value={notificationPrefs.leader_change}
                    onValueChange={onToggleLeaderChange}
                    trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                />
            </View>

            {milestones.map((milestone) => {
                const enabled = notificationPrefs.milestones.includes(milestone);
                return (
                    <View style={styles.bioRow} key={`milestone-${milestone}`}>
                        <Text style={styles.bioLabel}>{milestone} Beers Milestone</Text>
                        <Switch
                            value={enabled}
                            onValueChange={(value) => onToggleMilestone(milestone, value)}
                            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                        />
                    </View>
                );
            })}

            {onToggleAdminBroadcasts && (
                <View style={styles.bioRow}>
                    <Text style={styles.bioLabel}>Admin Broadcasts</Text>
                    <Switch
                        value={notificationPrefs.admin_broadcasts}
                        onValueChange={onToggleAdminBroadcasts}
                        trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                    />
                </View>
            )}

            <Text style={styles.bioDisclaimer}>
                Choose when you want push alerts for lead changes and beer milestones.
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    bioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceLight,
    },
    bioLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    bioDisclaimer: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
