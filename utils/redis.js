import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected!');
    });

    this.client.connect().catch((err) =>
      console.error('Redis connection error:', err.message || err)
    );
  }

  async isAlive() {
    try {
      // Check if the Redis client can ping the server
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis client is not alive:', error.message || error);
      return false;
    }
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error.message || error);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, { EX: duration });
    } catch (error) {
      console.error('Redis SET error:', error.message || error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error.message || error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
