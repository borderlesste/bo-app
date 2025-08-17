const fs = require('fs');
const path = require('path');

// Error levels
const ERROR_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Logger utility
class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectorySync();
  }

  ensureLogDirectorySync() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      pid: process.pid,
      hostname: require('os').hostname(),
      environment: process.env.NODE_ENV || 'development',
      ...meta
    };
  }

  async writeLog(level, message, meta = {}) {
    const logEntry = this.formatLogEntry(level, message, meta);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[37m'
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${logEntry.timestamp} - ${message}${reset}`);
    
    // File output
    try {
      const filename = `${level}-${new Date().toISOString().split('T')[0]}.log`;
      const filepath = path.join(this.logDir, filename);
      await fs.promises.appendFile(filepath, logLine);
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  error(message, meta = {}) {
    return this.writeLog(ERROR_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    return this.writeLog(ERROR_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    return this.writeLog(ERROR_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      return this.writeLog(ERROR_LEVELS.DEBUG, message, meta);
    }
  }
}

const logger = new Logger();

// Error notification system (can be extended to send to Slack, Discord, etc.)
class ErrorNotifier {
  static async notify(error, context = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, you might want to send to external service
    if (isProduction) {
      // Example: Send to Sentry, Slack, etc.
      console.log('Would send error notification to external service');
      
      // Uncomment and configure for actual services:
      // await this.sendToSentry(error, context);
      // await this.sendToSlack(error, context);
    }
    
    // Always log locally
    await logger.error('Application Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      user: context.userId || 'anonymous',
      url: context.url,
      method: context.method,
      ip: context.ip,
      userAgent: context.userAgent
    });
  }

  static async sendToSentry(error, context) {
    // Sentry integration example
    // const Sentry = require('@sentry/node');
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  static async sendToSlack(error, context) {
    // Slack webhook integration example
    // const webhook = process.env.SLACK_WEBHOOK_URL;
    // if (webhook) {
    //   const payload = {
    //     text: `🚨 Error in ${process.env.NODE_ENV}: ${error.message}`,
    //     attachments: [{
    //       color: 'danger',
    //       fields: [
    //         { title: 'URL', value: context.url, short: true },
    //         { title: 'User', value: context.userId || 'anonymous', short: true }
    //       ]
    //     }]
    //   };
    //   await axios.post(webhook, payload);
    // }
  }
}

// Global error handler middleware
const globalErrorHandler = async (err, req, res, next) => {
  const context = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method === 'POST' ? req.body : undefined,
    query: req.query,
    params: req.params
  };

  // Determine error type and status
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  }

  // Don't log 4xx errors as errors (they're client mistakes)
  if (statusCode >= 500) {
    await ErrorNotifier.notify(err, context);
  } else {
    await logger.warn(`Client Error ${statusCode}: ${message}`, context);
  }

  // Response format
  const errorResponse = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err;
  }

  // Include request ID if available
  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Generate request ID
  req.id = require('crypto').randomUUID();
  
  // Log request
  logger.info(`${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level](`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      requestId: req.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};

// Unhandled promise rejection handler
process.on('unhandledRejection', async (reason, promise) => {
  await logger.error('Unhandled Promise Rejection', {
    reason: reason?.toString(),
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // Graceful shutdown in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', async (error) => {
  console.error(error); // Log the full error to the console immediately
  await logger.error('Uncaught Exception', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
  
  // Always exit on uncaught exception
  process.exit(1);
});

module.exports = {
  logger,
  ErrorNotifier,
  globalErrorHandler,
  asyncErrorHandler,
  requestLogger,
  ERROR_LEVELS
};