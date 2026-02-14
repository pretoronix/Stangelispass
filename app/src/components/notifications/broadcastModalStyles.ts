import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';

export const broadcastModalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    title: {
        ...typography.headline,
        color: colors.textPrimary,
        fontWeight: '700',
        flex: 1,
    },
    closeButton: {
        padding: spacing.xs,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    input: {
        ...typography.body,
        color: colors.textPrimary,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
        padding: spacing.md,
        minHeight: 100,
        maxHeight: 200,
        textAlignVertical: 'top',
    },
    charCounter: {
        marginTop: spacing.xs,
        alignItems: 'flex-end',
    },
    charCountText: {
        ...typography.caption,
        color: colors.textMuted,
    },
    charCountError: {
        color: colors.error,
        fontWeight: '600',
    },
    helpText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    actionButton: {
        minWidth: 100,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.lg,
    },
});
