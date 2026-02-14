import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';
import { broadcastModalStyles as styles } from '@/components/notifications/broadcastModalStyles';

type BroadcastMessageInputProps = {
    message: string;
    onChangeMessage: (value: string) => void;
    remainingChars: number;
    isPending: boolean;
};

export function BroadcastMessageInput({
    message,
    onChangeMessage,
    remainingChars,
    isPending,
}: BroadcastMessageInputProps) {
    return (
        <View style={styles.inputContainer}>
            <TextInput
                value={message}
                onChangeText={onChangeMessage}
                placeholder="Type your message..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
                maxLength={100}
                autoFocus
                editable={!isPending}
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
    );
}
