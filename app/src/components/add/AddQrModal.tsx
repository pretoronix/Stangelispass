import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { QRGenerator } from '@/components/features/QRGenerator';
import { labels } from '@/ui/labels';
import type { User } from '@/services/supabase';

type AddQrModalProps = {
    visible: boolean;
    onClose: () => void;
    selectedUser: User | null;
    eventId?: string;
    stampId?: string;
    mode: 'stamp' | 'log';
    onShareQr: () => void;
    shareLoading: boolean;
    onQrRef: (ref: any) => void;
};

export function AddQrModal({
    visible,
    onClose,
    selectedUser,
    eventId,
    stampId,
    mode,
    onShareQr,
    shareLoading,
    onQrRef,
}: AddQrModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {selectedUser && (
                        <QRGenerator
                            userId={selectedUser.id}
                            userName={selectedUser.name}
                            eventId={eventId}
                            stampId={stampId}
                            mode={mode}
                            onQrRef={onQrRef}
                        />
                    )}
                    <Button
                        title="Share QR"
                        icon="share-social"
                        variant="secondary"
                        testID={labels.add.shareQr.testID}
                        accessibilityLabel={labels.add.shareQr.accessibilityLabel}
                        onPress={onShareQr}
                        disabled={shareLoading}
                        style={styles.modalActionButton}
                    />
                    <Button
                        title="Close"
                        variant="ghost"
                        onPress={onClose}
                        style={styles.modalCloseButton}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
    },
    modalActionButton: {
        marginTop: spacing.lg,
        width: '100%',
    },
    modalCloseButton: {
        marginTop: spacing.xl,
        width: '100%',
    },
});
