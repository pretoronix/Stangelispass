import { useState } from "react";
import { Alert } from "react-native";
import { copy } from "@/ui/copy";

/**
 * Hook for handling optimistic update errors
 * Provides user-friendly error messages and rollback notifications
 */

interface OptimisticError {
  message: string;
  timestamp: number;
}

export function useOptimisticError() {
  const [errors, setErrors] = useState<OptimisticError[]>([]);

  const addError = (message: string, options?: { retry?: () => void }) => {
    const error: OptimisticError = {
      message,
      timestamp: Date.now(),
    };

    setErrors((prev) => [...prev, error]);

    const buttons: any[] = [{ text: copy.common.ok, style: "cancel" }];

    if (options?.retry) {
      buttons.unshift({
        text: copy.common.retry,
        onPress: options.retry,
      });
    }

    Alert.alert(
      copy.common.alerts.updateFailed,
      `${message}\n\nYour changes were not saved and have been rolled back.`,
      buttons,
    );
  };

  const clearErrors = () => setErrors([]);

  return { errors, addError, clearErrors };
}
