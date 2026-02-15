import { useMutation } from "@tanstack/react-query";
import { sendAdminBroadcast } from "@/services/notifications";
import { reportError } from "@/utils/logger";

/**
 * React Query hooks for notification operations
 */

export function useSendBroadcast() {
  return useMutation({
    mutationFn: async ({
      eventId,
      message,
      senderId,
    }: {
      eventId: string;
      message: string;
      senderId: string;
    }) => {
      return await sendAdminBroadcast(eventId, message, senderId);
    },
    onSuccess: (data) => {
      if (!data.success) {
        reportError(new Error(data.error || "Broadcast failed"), {
          scope: "notifications",
          action: "useSendBroadcast",
          metadata: { count: data.count },
        });
      }
    },
    onError: (error: any) => {
      reportError(error, {
        scope: "notifications",
        action: "useSendBroadcast",
      });
    },
  });
}
