// client/src/utils/logger.js
// Frontend logging utility for browser-based applications
// Provides structured logging with different levels and formatting

const isDevelopment = import.meta.env.MODE === 'development';

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(level = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO) {
    this.level = level;
    this.context = '';
  }

  setContext(context) {
    this.context = context;
    return this;
  }

  shouldLog(level) {
    return level <= this.level;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel)[level];
    
    return {
      timestamp,
      level: levelName,
      context: this.context,
      message,
      args
    };
  }

  error(message, ...args) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const logData = this.formatMessage(LogLevel.ERROR, message, ...args);
      console.error(`🚨 [${logData.timestamp}] ERROR ${logData.context ? `[${logData.context}] ` : ''}${message}`, ...args);
      
      // In production, you might want to send errors to a logging service
      if (!isDevelopment && window.gtag) {
        window.gtag('event', 'exception', {
          description: message,
          fatal: false
        });
      }
    }
  }

  warn(message, ...args) {
    if (this.shouldLog(LogLevel.WARN)) {
      const logData = this.formatMessage(LogLevel.WARN, message, ...args);
      console.warn(`⚠️ [${logData.timestamp}] WARN ${logData.context ? `[${logData.context}] ` : ''}${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog(LogLevel.INFO)) {
      const logData = this.formatMessage(LogLevel.INFO, message, ...args);
      console.info(`ℹ️ [${logData.timestamp}] INFO ${logData.context ? `[${logData.context}] ` : ''}${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const logData = this.formatMessage(LogLevel.DEBUG, message, ...args);
      console.debug(`🐛 [${logData.timestamp}] DEBUG ${logData.context ? `[${logData.context}] ` : ''}${message}`, ...args);
    }
  }

  // API request logging
  logApiRequest(method, url, data = null) {
    this.debug(`API Request: ${method.toUpperCase()} ${url}`, data);
  }

  logApiResponse(method, url, status, data = null) {
    const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
    this.debug(`${emoji} API Response: ${method.toUpperCase()} ${url} - ${status}`, data);
  }

  logApiError(method, url, error) {
    this.error(`API Error: ${method.toUpperCase()} ${url}`, error);
  }

  // Performance logging
  logPerformance(label, duration) {
    this.info(`⏱️ Performance: ${label} took ${duration}ms`);
  }

  // User action logging
  logUserAction(action, details = null) {
    this.info(`👤 User Action: ${action}`, details);
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export both the class and the instance
export { Logger, LogLevel };
export default logger;