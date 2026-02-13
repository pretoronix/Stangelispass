import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useSendBroadcast } from '@/hooks/useNotificationsQuery';

interface BroadcastModalProps {
    visible: boolean;
    onClose: () => void;
    eventId: string;
    senderId: string;
    eventName: string;
}

const MAX_MESSAGE_LENGTH = 100;

export function BroadcastModal({ visible, onClose, eventId, senderId, eventName }: BroadcastModalProps) {
    const [message, setMessage] = useState('');
    const sendBroadcast = useSendBroadcast();

    const remainingChars = MAX_MESSAGE_LENGTH - message.length;
    const isValid = message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;

    const handleSend = async () => {
        if (!isValid || sendBroadcast.isPending) return;

        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            const result = await sendBroadcast.mutateAsync({
                eventId,
                message: message.trim(),
                senderId,
            });

            if (result.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Broadcast Sent! 📢',
                    `Your message was sent to ${result.count} member${result.count !== 1 ? 's' : ''}.`,
                    [{ text: 'OK' }]
                );
                setMessage('');
                onClose();
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(
                    'Failed to Send',
                    result.error || 'Could not send broadcast. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Error',
                error.message || 'An unexpected error occurred.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleClose = () => {
        if (message.trim() && !sendBroadcast.isPending) {
            Alert.alert(
                'Discard Message?',
                'Your message will be lost.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Discard', 
                        style: 'destructive',
                        onPress: () => {
                            setMessage('');
                            onClose();
                        }
                    },
                ]
            );
        } else {
            setMessage('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Ionicons name="megaphone" size={24} color={colors.primary} />
                            <Text style={styles.title}>Broadcast to {eventName}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={sendBroadcast.isPending}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type your message..."
                            placeholderTextColor={colors.textMuted}
                            style={styles.input}
                            multiline
                            maxLength={MAX_MESSAGE_LENGTH}
                            autoFocus
                            editable={!sendBroadcast.isPending}
                        />
                        <View style={styles.charCounter}>
                            <Text style={[
                                styles.charCountText,
                                remainingChars < 0 && styles.charCountError
                            ]}>
                                {remainingChars} characters left
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.helpText}>
                        💡 This message will be sent to all active event members who haven't opted out.
                    </Text>

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={handleClose}
                            disabled={sendBroadcast.isPending}
                            style={styles.actionButton}
                            testID="broadcast-cancel-button"
                        />
                        <Button
                            title={sendBroadcast.isPending ? 'Sending...' : 'Send'}
                            onPress={handleSend}
                            disabled={!isValid || sendBroadcast.isPending}
                            style={styles.actionButton}
                            testID="broadcast-send-button"
                        />
                    </View>

                    {sendBroadcast.isPending && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
