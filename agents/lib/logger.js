/**
 * Logger Utility for Agent System
 * Provides structured logging with different levels
 */
import * as fs from 'fs';
import * as path from 'path';
export class AgentLogger {
    logLevel;
    logFile;
    constructor(logLevel = 'info', logFile) {
        this.logLevel = logLevel;
        this.logFile = logFile;
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
    formatEntry(entry) {
        const { timestamp, level, agent, action, message, data } = entry;
        const parts = [
            `[${timestamp}]`,
            `[${level.toUpperCase()}]`,
        ];
        if (agent)
            parts.push(`[${agent}]`);
        if (action)
            parts.push(`[${action}]`);
        parts.push(message);
        if (data) {
            parts.push(JSON.stringify(data, null, 2));
        }
        return parts.join(' ');
    }
    log(level, message, data, agent, action) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            agent,
            action,
            message,
            data,
        };
        const formatted = this.formatEntry(entry);
        // Console output
        switch (level) {
            case 'debug':
            case 'info':
                console.log(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
        // File output
        if (this.logFile) {
            fs.appendFileSync(this.logFile, formatted + '\n');
        }
    }
    debug(message, data, agent, action) {
        this.log('debug', message, data, agent, action);
    }
    info(message, data, agent, action) {
        this.log('info', message, data, agent, action);
    }
    warn(message, data, agent, action) {
        this.log('warn', message, data, agent, action);
    }
    error(message, data, agent, action) {
        this.log('error', message, data, agent, action);
    }
    /**
     * Create a child logger for a specific agent
     */
    forAgent(agentName) {
        const logger = new AgentLogger(this.logLevel, this.logFile);
        const originalLog = logger.log.bind(logger);
        logger.log = (level, message, data, _agent, action) => {
            originalLog(level, message, data, agentName, action);
        };
        return logger;
    }
}
// Global logger instance
export const logger = new AgentLogger('info', path.join(process.cwd(), 'agents', 'agent.log'));
