import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, typography, borderRadius } from "@/lib/theme";
import { reportError } from "@/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A lightweight Error Boundary for isolating feature-level failures.
 * Use this to wrap specific components like Leaderboard or Activity Feed.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, {
      scope: "ui",
      action: `error_boundary_${this.props.name || "generic"}`,
      metadata: { componentStack: errorInfo.componentStack },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Feature Unavailable</Text>
          <Text style={styles.message} numberOfLines={2}>
            {this.state.error?.message ||
              "A small error occurred in this section."}
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonText}>Retry Section</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    alignItems: "center",
    margin: spacing.sm,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    fontSize: 14,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  buttonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
