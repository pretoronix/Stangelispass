import { StyleSheet } from "react-native";
import { colors, spacing, typography, borderRadius } from "@/lib/theme";

export const commentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  commentItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    position: "relative",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  commentUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    ...typography.headline,
    fontSize: 15,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    ...typography.small,
    fontSize: 10,
    color: colors.background,
    fontWeight: "600",
  },
  timestamp: {
    ...typography.small,
    color: colors.textMuted,
  },
  commentText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  deleteButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.callout,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    alignItems: "flex-end",
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  characterCount: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.xs,
    ...typography.small,
    fontSize: 10,
    color: colors.warning,
  },
  characterCountError: {
    color: colors.error,
    fontWeight: "600",
  },
  sendButton: {
    padding: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
