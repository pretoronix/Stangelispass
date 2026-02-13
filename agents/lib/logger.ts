/**
 * Logger Utility for Agent System
 * Provides structured logging with different levels
 */

import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  agent?: string;
  action?: string;
  message: string;
  data?: any;
}

export class AgentLogger {
  private logLevel: LogLevel;
  private logFile?: string;

  constructor(logLevel: LogLevel = 'info', logFile?: string) {
    this.logLevel = logLevel;
    this.logFile = logFile;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, agent, action, message, data } = entry;
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
    ];

    if (agent) parts.push(`[${agent}]`);
    if (action) parts.push(`[${action}]`);
    parts.push(message);

    if (data) {
      parts.push(JSON.stringify(data, null, 2));
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, data?: any, agent?: string, action?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
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

  debug(message: string, data?: any, agent?: string, action?: string): void {
    this.log('debug', message, data, agent, action);
  }

  info(message: string, data?: any, agent?: string, action?: string): void {
    this.log('info', message, data, agent, action);
  }

  warn(message: string, data?: any, agent?: string, action?: string): void {
    this.log('warn', message, data, agent, action);
  }

  error(message: string, data?: any, agent?: string, action?: string): void {
    this.log('error', message, data, agent, action);
  }

  /**
   * Create a child logger for a specific agent
   */
  forAgent(agentName: string): AgentLogger {
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
