// Simple logger for frontend
const isDevelopment = import.meta.env.DEV;

class Logger {
  constructor() {
    this.isDevelopment = isDevelopment;
  }

  // Log info messages
  info(message, data = {}) {
    if (this.isDevelopment) {
      console.log(`ℹ️ ${message}`, data);
    }
  }

  // Log error messages
  error(message, error = null, data = {}) {
    if (this.isDevelopment) {
      console.error(`❌ ${message}`, error, data);
    }
  }

  // Log warning messages
  warn(message, data = {}) {
    if (this.isDevelopment) {
      console.warn(`⚠️ ${message}`, data);
    }
  }

  // Log debug messages
  debug(message, data = {}) {
    if (this.isDevelopment) {
      console.debug(`🔍 ${message}`, data);
    }
  }

  // Log success messages
  success(message, data = {}) {
    if (this.isDevelopment) {
      console.log(`✅ ${message}`, data);
    }
  }
}

export const logInfo = (message, data = {}) => {
  logger.info(message, data);
};

export const logError = (message, error = null, data = {}) => {
  logger.error(message, error, data);
};

export const logWarn = (message, data = {}) => {
  logger.warn(message, data);
};

export const logDebug = (message, data = {}) => {
  logger.debug(message, data);
};

export const logSuccess = (message, data = {}) => {
  logger.success(message, data);
};

const logger = new Logger();
export default logger; 