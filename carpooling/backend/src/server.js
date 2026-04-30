require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');
const { getRedisClient } = require('./config/redis');
const logger = require('./config/logger');

const PORT = parseInt(process.env.PORT) || 3000;

async function start() {
  await testConnection();

  try {
    const redis = getRedisClient();
    await redis.connect();
  } catch (err) {
    logger.warn('Redis connection skipped in dev: ' + err.message);
  }

  app.listen(PORT, () => {
    logger.info(`Carpooling API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server: ' + err.message);
  process.exit(1);
});
