import { app } from 'electron';
import { join } from 'path';
import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

interface LogMeta {
  [key: string]: any;
}

class LogService {
  private logDir: string;
  private logFile: string;
  private isDev: boolean;

  constructor() {
    this.isDev = !app.isPackaged;
    this.logDir = join(app.getPath('userData'), 'logs');
    this.logFile = join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.initLogDirectory();
  }

  private async initLogDirectory(): Promise<void> {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
  }

  private async log(level: string, message: string, meta?: LogMeta): Promise<void> {
    const logMessage = this.formatMessage(level, message, meta);
    
    // Always log to file
    await appendFile(this.logFile, logMessage);
    
    // In development, also log to console
    if (this.isDev) {
      switch (level) {
        case 'ERROR':
          console.error(message, meta);
          break;
        case 'WARN':
          console.warn(message, meta);
          break;
        default:
          console.log(message, meta);
      }
    }
  }

  async info(message: string, meta?: LogMeta): Promise<void> {
    await this.log('INFO', message, meta);
  }

  async error(message: string, meta?: LogMeta): Promise<void> {
    await this.log('ERROR', message, meta);
  }

  async warn(message: string, meta?: LogMeta): Promise<void> {
    await this.log('WARN', message, meta);
  }

  async debug(message: string, meta?: LogMeta): Promise<void> {
    if (this.isDev) {
      await this.log('DEBUG', message, meta);
    }
  }
}

export const logger = new LogService(); 