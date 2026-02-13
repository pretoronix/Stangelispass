import React from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { labels } from '@/ui/labels';

interface AddUserSectionProps {
    newUserName: string;
    setNewUserName: (name: string) => void;
    isNewUserAdmin: boolean;
    setIsNewUserAdmin: (isAdmin: boolean) => void;
    loading: boolean;
    onAddUser: () => void;
    onStartEvent: () => void;
    onResetEvent: () => void;
    canManageEvent: boolean;
    isAdmin: boolean;
    hasCurrentUser: boolean;
}

export const AddUserSection: React.FC<AddUserSectionProps> = ({
    newUserName,
    setNewUserName,
    isNewUserAdmin,
    setIsNewUserAdmin,
    loading,
    onAddUser,
    onStartEvent,
    onResetEvent,
    canManageEvent,
    isAdmin,
    hasCurrentUser,
}) => {
    return (
        <Card>
            <TextInput
                style={styles.input}
                placeholder="New member name..."
                placeholderTextColor={colors.textMuted}
                value={newUserName}
                onChangeText={setNewUserName}
            />
            <View style={styles.adminToggle}>
                <View>
                    <Text style={styles.toggleLabel}>Admin Privileges</Text>
                    <Text style={styles.toggleSublabel}>Can log beers for others</Text>
                </View>
                <Switch
                    value={isNewUserAdmin}
                    onValueChange={setIsNewUserAdmin}
                    trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.surfaceLight}
                />
            </View>
            <Button
                title={loading ? 'Creating...' : 'Add Member'}
                onPress={onAddUser}
                icon="person-add"
                testID={labels.settings.addUser.testID}
                accessibilityLabel={labels.settings.addUser.accessibilityLabel}
                disabled={loading}
            />
            <View style={styles.adminActions}>
                <Button
                    title="Start New Event"
                    variant="secondary"
                    onPress={onStartEvent}
                    testID={labels.settings.startEvent.testID}
                    accessibilityLabel={labels.settings.startEvent.accessibilityLabel}
                    disabled={!hasCurrentUser || !canManageEvent}
                    style={styles.adminActionButton}
                />
                <Button
                    title="Reset Event Data"
                    variant="danger"
                    onPress={onResetEvent}
                    testID={labels.settings.resetEvent.testID}
                    accessibilityLabel={labels.settings.resetEvent.accessibilityLabel}
                    disabled={!isAdmin}
                    style={styles.adminActionButton}
                />
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 17,
        marginBottom: spacing.md,
    },
    adminToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    toggleLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    toggleSublabel: {
        fontSize: 13,
        color: colors.textMuted,
    },
    adminActions: {
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    adminActionButton: {
        height: 44,
    },
});
