import React from 'react';
import { Modal, View, Text, TextInput, Platform } from 'react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { homeScreenStyles as styles } from '@/styles/screens/homeScreenStyles';

interface StartRoundPromptProps {
    visible: boolean;
    pendingAction: 'start_round' | 'join_event';
    startRoundName: string;
    setStartRoundName: (value: string) => void;
    beerPrice: string;
    setBeerPrice: (value: string) => void;
    pendingJoinEventName: string;
    promptSubmitting: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

export function StartRoundPrompt({
    visible,
    pendingAction,
    startRoundName,
    setStartRoundName,
    beerPrice,
    setBeerPrice,
    pendingJoinEventName,
    promptSubmitting,
    onSubmit,
    onCancel,
}: StartRoundPromptProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.startRoundModal}>
                <View style={styles.startRoundCard}>
                    <Text style={styles.startRoundTitle}>
                        {pendingAction === 'start_round' ? 'Start Round' : 'Join Group'}
                    </Text>
                    <Text style={styles.startRoundSubtitle}>
                        {pendingAction === 'start_round'
                            ? 'Enter your name to start a round:'
                            : `Enter your name to join ${pendingJoinEventName || 'this round'}:`}
                    </Text>
                    <TextInput
                        value={startRoundName}
                        onChangeText={setStartRoundName}
                        placeholder="Your name"
                        placeholderTextColor={colors.textMuted}
                        style={styles.startRoundInput}
                        autoFocus
                        autoCapitalize="words"
                        returnKeyType={pendingAction === 'start_round' ? 'next' : 'done'}
                        onSubmitEditing={() => {
                            if (pendingAction === 'join_event') onSubmit();
                        }}
                    />
                    {pendingAction === 'start_round' && (
                        <View>
                            <Text style={styles.startRoundLabel}>Beer Price (CHF):</Text>
                            <TextInput
                                value={beerPrice}
                                onChangeText={setBeerPrice}
                                placeholder="5.00"
                                placeholderTextColor={colors.textMuted}
                                style={styles.startRoundInput}
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                onSubmitEditing={onSubmit}
                            />
                        </View>
                    )}
                    <View style={styles.startRoundActions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onCancel}
                            style={styles.startRoundButton}
                        />
                        <Button
                            title={promptSubmitting ? 'Please wait...' : (pendingAction === 'start_round' ? 'Start' : 'Join')}
                            onPress={onSubmit}
                            disabled={promptSubmitting}
                            style={styles.startRoundButton}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
