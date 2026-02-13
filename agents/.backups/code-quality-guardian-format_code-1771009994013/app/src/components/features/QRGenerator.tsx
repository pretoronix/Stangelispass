import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';

interface QRGeneratorProps {
    userId: string;
    userName: string;
    eventId?: string;
    stampId?: string;
    mode?: 'stamp' | 'log';
    onQrRef?: (ref: any) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
    userId,
    userName,
    eventId,
    stampId,
    mode = 'stamp',
    onQrRef,
}) => {
    const payload = mode === 'log'
        ? JSON.stringify({ userId, eventId: eventId || '' })
        : stampId
            ? JSON.stringify({ type: 'STAMP_BEER', stampId })
            : JSON.stringify({ type: 'STAMP_BEER', userId, eventId: eventId || '' });
    const labelText = mode === 'log'
        ? `Admin scan adds a beer for ${userName}`
        : `Stamp +1 beer for ${userName}`;
    const hintText = mode === 'log'
        ? 'Only admins should scan this code to log a beer'
        : 'Show this to the participant to claim one beer';

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{labelText}</Text>
            <View style={styles.qrWrapper}>
                <QRCode
                    value={payload}
                    size={200}
                    color={colors.textPrimary}
                    backgroundColor={colors.surface}
                    getRef={onQrRef}
                />
            </View>
            <Text style={styles.hint}>{hintText}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
    },
    label: {
        ...typography.headline,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    qrWrapper: {
        padding: spacing.md,
        backgroundColor: '#FFFFFF', // High contrast for scanner
        borderRadius: borderRadius.md,
    },
    hint: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.lg,
    },
});
