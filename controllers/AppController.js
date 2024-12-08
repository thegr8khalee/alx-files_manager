import redisClient from '../utils/redis.js'; // Import Redis client
import dbClient from '../utils/db.js'; // Import DB client

// Get status of Redis and DB
export const getStatus = async (req, res) => {
  try {
    // Check if Redis is alive
    const redisStatus = await redisClient.isAlive();

    // Check if DB is alive
    const dbStatus = await dbClient.isAlive();

    res.status(200).json({
      redis: redisStatus,
      db: dbStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error checking status',
      error: error.message,
    });
  }
};

// Get stats (number of users and files)
export const getStats = async (req, res) => {
  try {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    res.status(200).json({
      users: usersCount,
      files: filesCount,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching stats',
      error: error.message,
    });
  }
};
