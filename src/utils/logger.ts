/**
 * Structured Logger for the Autonomic System
 */

import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: string, message: string, meta?: Record<string, unknown>): void {
    const logData = {
      context: this.context,
      ...meta,
    };

    switch (level) {
      case 'debug':
        pinoLogger.debug(logData, message);
        break;
      case 'info':
        pinoLogger.info(logData, message);
        break;
      case 'warn':
        pinoLogger.warn(logData, message);
        break;
      case 'error':
        pinoLogger.error(logData, message);
        break;
      default:
        pinoLogger.info(logData, message);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }
}
