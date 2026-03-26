const redis = require('redis');
const { Pool } = require('pg');

// Redis cache client - optional, graceful degradation if unavailable
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  console.warn('⚠️  Redis Client Error - caching disabled:', err.message);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected - caching enabled');
  isRedisConnected = true;
});

// Connect to Redis with graceful fallback
redisClient.connect().catch(err => {
  console.warn('⚠️  Failed to connect to Redis - caching disabled:', err.message);
  isRedisConnected = false;
});

class CacheService {
  // Cache keys
  static KEYS = {
    business: (id) => `business:${id}`,
    services: (businessId) => `services:${businessId}`,
    availability: (businessId) => `availability:${businessId}`,
    bookings: (businessId) => `bookings:${businessId}`,
    analytics: (businessId) => `analytics:${businessId}`,
    publicBooking: (slug) => `public:${slug}`
  };

  // Cache durations (seconds)
  static DURATIONS = {
    business: 3600, // 1 hour
    services: 1800, // 30 minutes
    availability: 900, // 15 minutes
    bookings: 300, // 5 minutes
    analytics: 3600, // 1 hour
    publicBooking: 600 // 10 minutes
  };

  async get(key) {
    try {
      if (!isRedisConnected) return null;
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  async set(key, value, duration = 3600) {
    try {
      if (!isRedisConnected) return; // Skip if Redis unavailable
      await redisClient.setEx(key, duration, JSON.stringify(value));
    } catch (err) {
      console.error('Cache set error:', err);
      isRedisConnected = false;
    }
  }

  async delete(key) {
    try {
      if (!isRedisConnected) return; // Skip if Redis unavailable
      await redisClient.del(key);
    } catch (err) {
      console.error('Cache delete error:', err);
      isRedisConnected = false;
    }
  }

  async invalidateBusinessCache(businessId) {
    try {
      // Invalidate all business-related caches
      await Promise.all([
        this.delete(this.KEYS.business(businessId)),
        this.delete(this.KEYS.services(businessId)),
        this.delete(this.KEYS.availability(businessId)),
        this.delete(this.KEYS.bookings(businessId)),
        this.delete(this.KEYS.analytics(businessId))
      ]);
    } catch (err) {
      console.error('Cache invalidation error:', err);
    }
  }

  async getOrFetch(key, fetchFn, duration = 3600) {
    try {
      // Try to get from cache
      let data = await this.get(key);

      if (!data) {
        // Fetch from database
        data = await fetchFn();

        // Store in cache
        await this.set(key, data, duration);
      }

      return data;
    } catch (err) {
      console.error('Get or fetch error:', err);
      // Fallback to database
      return await fetchFn();
    }
  }
}

// Warm cache on startup
async function warmCache() {
  try {
    if (!isRedisConnected) {
      console.log('⏭️  Skipping cache warming - Redis not connected');
      return;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('🔥 Warming up cache...');

    // Get all businesses
    const businesses = await pool.query('SELECT id FROM businesses LIMIT 100');

    for (const business of businesses.rows) {
      try {
        // Cache services
        const services = await pool.query(
          'SELECT * FROM services WHERE business_id = $1 AND active = true',
          [business.id]
        );

        await cacheService.set(
          CacheService.KEYS.services(business.id),
          services.rows,
          CacheService.DURATIONS.services
        );

        // Cache availability
        const availability = await pool.query(
          'SELECT * FROM availability WHERE business_id = $1',
          [business.id]
        );

        await cacheService.set(
          CacheService.KEYS.availability(business.id),
          availability.rows,
          CacheService.DURATIONS.availability
        );
      } catch (businessErr) {
        console.warn(`⚠️  Error warming cache for business ${business.id}:`, businessErr.message);
        // Continue to next business instead of stopping
        continue;
      }
    }

    console.log('✅ Cache warmed successfully');
    await pool.end();
  } catch (err) {
    console.error('⚠️  Cache warming failed:', err.message);
    // Don't crash the app if cache warming fails
  }
}

const cacheService = new CacheService();

module.exports = {
  cacheService,
  warmCache,
  redisClient
};
