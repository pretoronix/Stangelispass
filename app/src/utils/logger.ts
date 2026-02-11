type LogContext = {
    scope: string;
    action: string;
    eventId?: string | null;
    userId?: string | null;
    metadata?: Record<string, any>;
};

type LogLevel = 'info' | 'warn' | 'error';

const buildPayload = (level: LogLevel, message: string, context: LogContext) => ({
    ts: new Date().toISOString(),
    level,
    message,
    scope: context.scope,
    action: context.action,
    eventId: context.eventId || null,
    userId: context.userId || null,
    metadata: context.metadata || {},
});

const emit = (level: LogLevel, message: string, context: LogContext) => {
    const payload = buildPayload(level, message, context);
    if (level === 'error') {
        console.error(payload);
    } else if (level === 'warn') {
        console.warn(payload);
    } else {
        console.log(payload);
    }
    return payload;
};

export const logInfo = (message: string, context: LogContext) => emit('info', message, context);
export const logWarn = (message: string, context: LogContext) => emit('warn', message, context);
export const logError = (message: string, context: LogContext) => emit('error', message, context);

export const reportError = (
    error: unknown,
    context: Omit<LogContext, 'action' | 'scope'> & { scope?: string; action?: string }
) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message || 'error';
    return logError(message, {
        scope: context.scope || 'app',
        action: context.action || 'error',
        eventId: context.eventId || null,
        userId: context.userId || null,
        metadata: {
            message: err.message,
            stack: err.stack,
            ...context.metadata,
        },
    });
};
