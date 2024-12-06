import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.redis = createClient();

    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Connect to Redis
    this.redis.connect().catch((err) => {
      console.error('Redis connection error:', err);
    });
  }

  isAlive() {
    // Return connection status using the `isOpen` property
    return this.redis.isOpen;
  }

  async get(key) {
    try {
      return await this.redis.get(key);
    } catch (err) {
      console.error(`Error fetching key "${key}":`, err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.redis.set(key, value, { EX: duration });
    } catch (err) {
      console.error(`Error setting key "${key}":`, err);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error(`Error deleting key "${key}":`, err);
    }
  }
}

// Create an instance of RedisClient and export it
const redisClient = new RedisClient();
export default redisClient;
