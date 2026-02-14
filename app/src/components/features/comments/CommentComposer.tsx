import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { commentsStyles as styles } from './commentsStyles';

type CommentComposerProps = {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isPending: boolean;
    isNearLimit: boolean;
    isOverLimit: boolean;
    characterCount: number;
};

export function CommentComposer({
    value,
    onChangeText,
    onSubmit,
    canSubmit,
    isPending,
    isNearLimit,
    isOverLimit,
    characterCount,
}: CommentComposerProps) {
    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input,
                        isOverLimit && styles.inputError,
                    ]}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    maxLength={550}
                    multiline
                    textAlignVertical="top"
                    editable={!isPending}
                />
                {isNearLimit && (
                    <Text
                        style={[
                            styles.characterCount,
                            isOverLimit && styles.characterCountError,
                        ]}
                    >
                        {characterCount}/500
                    </Text>
                )}
            </View>

            <TouchableOpacity
                onPress={onSubmit}
                disabled={!canSubmit || isPending}
                style={[
                    styles.sendButton,
                    (!canSubmit || isPending) && styles.sendButtonDisabled,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                {isPending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Ionicons
                        name="send"
                        size={20}
                        color={canSubmit ? colors.primary : colors.textMuted}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
}
