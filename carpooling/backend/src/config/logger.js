const { createLogger, format, transports } = require('winston');

const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'carpooling-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log',   level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Human-readable output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(colorize(), simple()),
  }));
}

module.exports = logger;
