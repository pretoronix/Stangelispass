import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { PASS_TYPES, PASS_TYPE_LABELS, PASS_TYPE_DURATIONS_DAYS, PASS_TYPE_PRICES_CHF, PassType } from '@/utils/settings/settingsConstants';

interface StartEventModalProps {
    visible: boolean;
    eventName: string;
    passType: PassType;
    onChangeEventName: (name: string) => void;
    onChangePassType: (type: PassType) => void;
    onCancel: () => void;
    onStart: () => void;
}

export const StartEventModal: React.FC<StartEventModalProps> = ({
    visible,
    eventName,
    passType,
    onChangeEventName,
    onChangePassType,
    onCancel,
    onStart,
}) => {
    const durationDays = PASS_TYPE_DURATIONS_DAYS[passType];
    const price = PASS_TYPE_PRICES_CHF[passType];
    const durationLabel = durationDays === 1 ? '1 day' : `${durationDays} days`;
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Start New Event</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Event name..."
                        placeholderTextColor={colors.textMuted}
                        value={eventName}
                        onChangeText={onChangeEventName}
                    />
                    <View style={styles.passTypeRow}>
                        {PASS_TYPES.map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => onChangePassType(type)}
                                style={[
                                    styles.passTypeButton,
                                    passType === type && styles.passTypeButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.passTypeText,
                                        passType === type && styles.passTypeTextActive,
                                    ]}
                                >
                                    {PASS_TYPE_LABELS[type]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <Text style={styles.passTypeHint}>
                        {`${durationLabel} · CHF ${price.toFixed(2)}`}
                    </Text>
                    <View style={styles.modalActions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onCancel}
                            style={styles.modalButton}
                        />
                        <Button
                            title="Start"
                            onPress={onStart}
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 17,
        marginBottom: spacing.md,
    },
    passTypeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    passTypeHint: {
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: spacing.md,
    },
    passTypeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
    },
    passTypeButtonActive: {
        backgroundColor: colors.primary,
    },
    passTypeText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    passTypeTextActive: {
        color: colors.background,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    modalButton: {
        height: 40,
        paddingHorizontal: spacing.md,
    },
});
