const { getRedisClient, TTL } = require('../config/redis');

function buildRideSearchKey(filters) {
  const { source = '', destination = '', date = '', minPrice = '', maxPrice = '' } = filters;
  return `rides:${source}:${destination}:${date}:${minPrice}:${maxPrice}`.toLowerCase();
}

async function getCachedRides(filters) {
  try {
    const redis = getRedisClient();
    const key   = buildRideSearchKey(filters);
    const data  = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCachedRides(filters, rides) {
  try {
    const redis = getRedisClient();
    const key   = buildRideSearchKey(filters);
    await redis.setex(key, TTL, JSON.stringify(rides));
  } catch {
    // cache failures are non-fatal
  }
}

async function invalidateRideCache(source, destination) {
  try {
    const redis  = getRedisClient();
    const pattern = `rides:${source || '*'}:${destination || '*'}:*`.toLowerCase();
    const keys   = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    // non-fatal
  }
}

async function getCachedStats() {
  try {
    const redis = getRedisClient();
    const data  = await redis.get('admin:stats');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCachedStats(stats) {
  try {
    const redis = getRedisClient();
    await redis.setex('admin:stats', 60, JSON.stringify(stats));
  } catch {}
}

module.exports = { getCachedRides, setCachedRides, invalidateRideCache, getCachedStats, setCachedStats };
