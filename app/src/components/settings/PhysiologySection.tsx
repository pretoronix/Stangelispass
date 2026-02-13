import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { User } from '@/services/supabase';
import { Card } from '@/components/ui/Card';
import { GENDERS } from '@/utils/settings/settingsConstants';
import { playHapticSelection, capitalizeFirst } from '@/utils/settings/settingsHelpers';

interface PhysiologySectionProps {
    currentUser: User;
    onUpdateWeight: (weight: number) => void;
    onUpdateGender: (gender: typeof GENDERS[number]) => void;
}

export const PhysiologySection: React.FC<PhysiologySectionProps> = ({
    currentUser,
    onUpdateWeight,
    onUpdateGender,
}) => {
    return (
        <Card>
            <View style={styles.bioRow}>
                <Text style={styles.bioLabel}>Weight (kg)</Text>
                <TextInput
                    style={styles.bioInput}
                    keyboardType="numeric"
                    value={currentUser.weight_kg?.toString() || '80'}
                    onChangeText={(val) => {
                        const weight = parseFloat(val);
                        if (!isNaN(weight)) {
                            onUpdateWeight(weight);
                        }
                    }}
                />
            </View>
            <View style={styles.bioRow}>
                <Text style={styles.bioLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                    {GENDERS.map((g) => (
                        <Pressable
                            key={g}
                            onPress={() => {
                                onUpdateGender(g);
                                playHapticSelection();
                            }}
                            style={[
                                styles.genderButton,
                                currentUser.gender === g && styles.genderButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.genderButtonText,
                                currentUser.gender === g && styles.genderButtonTextActive
                            ]}>
                                {capitalizeFirst(g)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
            <Text style={styles.bioDisclaimer}>
                Stats are used strictly for the "for fun" BAC estimator.
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
    bioInput: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'right',
        width: 100,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    genderButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surfaceLight,
    },
    genderButtonActive: {
        backgroundColor: colors.primary,
    },
    genderButtonText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    genderButtonTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    bioDisclaimer: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
