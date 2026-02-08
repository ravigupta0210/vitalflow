// ============ SHARED IN-MEMORY CACHE ============
// Simple cache with TTL for expensive queries
const cache = new Map();

const CACHE_TTL = {
  dashboard: 30 * 1000,      // 30 seconds
  insights: 60 * 1000,       // 1 minute
  comprehensive: 60 * 1000,  // 1 minute
  aiInsights: 5 * 60 * 1000, // 5 minutes for AI-generated content
  progress: 10 * 1000,       // 10 seconds for live progress
  streaks: 30 * 1000         // 30 seconds for streaks
};

function getCacheKey(userId, type) {
  return `${userId}:${type}`;
}

function getCache(userId, type) {
  const key = getCacheKey(userId, type);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(userId, type, data) {
  const key = getCacheKey(userId, type);
  const ttl = CACHE_TTL[type] || 30 * 1000;
  cache.set(key, { data, expiry: Date.now() + ttl });
}

function invalidateUserCache(userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key);
    }
  }
}

function invalidateCacheType(userId, type) {
  const key = getCacheKey(userId, type);
  cache.delete(key);
}

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now >= value.expiry) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  getCache,
  setCache,
  invalidateUserCache,
  invalidateCacheType,
  CACHE_TTL
};
