const Redis = require('ioredis');

let client;

function getRedisClient() {
  if (!client) {
    client = new Redis({
      host:            process.env.REDIS_HOST || 'localhost',
      port:            parseInt(process.env.REDIS_PORT) || 6379,
      retryStrategy:   (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      lazyConnect:     true,
      tls:             process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost' ? {} : undefined,
    });

    client.on('connect', () => console.log('ElastiCache Redis connected'));
    client.on('error',   (err) => console.error('Redis error:', err.message));
  }
  return client;
}

const TTL = parseInt(process.env.REDIS_TTL) || 300;

module.exports = { getRedisClient, TTL };
