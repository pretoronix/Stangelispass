import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { reportError } from '@/utils/logger';

type AppErrorBoundaryProps = {
    children: React.ReactNode;
};

type AppErrorBoundaryState = {
    hasError: boolean;
    message: string;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = {
        hasError: false,
        message: '',
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return {
            hasError: true,
            message: error?.message || 'Unknown error',
        };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        reportError(error, {
            scope: 'ui',
            action: 'error_boundary',
            eventId: null,
            metadata: { componentStack: info?.componentStack },
        });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, message: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.subtitle}>{this.state.message || 'Please retry.'}</Text>
                        <Pressable onPress={this.handleRetry} style={styles.button}>
                            <Text style={styles.buttonText}>Try again</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.surfaceLight,
    },
    title: {
        ...typography.title,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    button: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
    },
    buttonText: {
        ...typography.headline,
        color: colors.background,
    },
});
