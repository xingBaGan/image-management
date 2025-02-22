const { app } = require('electron');
const { join } = require('path');
const { appendFile, mkdir } = require('fs/promises');
const { existsSync } = require('fs');

class LogService {
  logDir;
  logFile;
  isDev;

  constructor() {
    this.isDev = !app.isPackaged;
    this.logDir = join(app.getPath('userData'), 'logs');
    this.logFile = join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.initLogDirectory();
  }

   async initLogDirectory() {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
  }

  async log(level, message, meta) {
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

  async info(message, meta) {
    await this.log('INFO', message, meta);
  }

  async error(message, meta) {
    await this.log('ERROR', message, meta);
  }

  async warn(message, meta) {
    await this.log('WARN', message, meta);
  }

  async debug(message, meta) {
    if (this.isDev) {
      await this.log('DEBUG', message, meta);
    }
  }
}

const logger = new LogService();
module.exports = {
  logger,
} 