type LogContext = {
  scope: string;
  action: string;
  eventId?: string | null;
  userId?: string | null;
  metadata?: Record<string, any>;
};

type LogLevel = "info" | "warn" | "error";

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch (_e) {
    return "[unserializable]";
  }
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message || "error",
      stack: error.stack,
      raw: error,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object") {
    const anyErr = error as any;
    const message =
      anyErr.message ||
      anyErr.error_description ||
      anyErr.error ||
      anyErr.details ||
      anyErr.hint ||
      safeStringify(anyErr);
    return {
      message: String(message || "error"),
      stack: anyErr.stack,
      raw: error,
    };
  }
  return { message: String(error || "error") };
};

const MAX_BREADCRUMBS = 20;
const breadcrumbs: {
  ts: string;
  level: LogLevel;
  message: string;
  context: any;
}[] = [];

export const addBreadcrumb = (
  message: string,
  context?: any,
  level: LogLevel = "info",
) => {
  breadcrumbs.push({ ts: new Date().toISOString(), level, message, context });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
};

const buildPayload = (
  level: LogLevel,
  message: string,
  context: LogContext,
) => ({
  ts: new Date().toISOString(),
  level,
  message,
  scope: context.scope,
  action: context.action,
  eventId: context.eventId || null,
  userId: context.userId || null,
  metadata: {
    ...context.metadata,
    breadcrumbs: level === "error" ? [...breadcrumbs] : undefined,
  },
});

const emit = (level: LogLevel, message: string, context: LogContext) => {
  addBreadcrumb(
    message,
    { scope: context.scope, action: context.action },
    level,
  );
  const payload = buildPayload(level, message, context);
  // Use console directly to avoid recursion through reportError/logError
  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
  return payload;
};

export const logInfo = (message: string, context: LogContext) =>
  emit("info", message, context);
export const logWarn = (message: string, context: LogContext) =>
  emit("warn", message, context);
export const logError = (message: string, context: LogContext) =>
  emit("error", message, context);

/**
 * Log an expected warning (e.g., missing Supabase table, simulator limitations)
 * These are not errors - they're expected conditions in certain environments
 */
export const logExpected = (message: string, scope: string) => {
  console.log(`[${scope}] ${message} (expected)`);
};

export const reportError = (
  error: unknown,
  context: Omit<LogContext, "action" | "scope"> & {
    scope?: string;
    action?: string;
  },
) => {
  const normalized = normalizeError(error);
  const message = normalized.message || "error";
  return logError(message, {
    scope: context.scope || "app",
    action: context.action || "error",
    eventId: context.eventId || null,
    userId: context.userId || null,
    metadata: {
      message,
      stack: normalized.stack,
      raw: normalized.raw,
      ...context.metadata,
    },
  });
};
