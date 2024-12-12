import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';

export const getAuth = async (token) => {
  try {
    if (!token) {
      return { error: 'Token is required' };
    }

    console.log('Received Token:', token);

    const userId = await redisClient.get(`auth_${token}`);
    console.log('User ID from Redis:', userId);

    if (!userId) {
      return { error: 'Unauthorized - Invalid or expired token' };
    }

    // Convert userId to ObjectId to match MongoDB _id type
    const userObjectId = new ObjectId(userId);
    console.log('Converted User ID:', userObjectId);

    const user = await dbClient.client
      .db()
      .collection('users')
      .findOne({ _id: userObjectId });
    console.log('User from DB:', user);

    if (!user) {
      return { error: 'Unauthorized - User not found' };
    }

    return {
      id: user._id,
      email: user.email,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      message: 'Error retrieving user',
      error: error.message,
    };
  }
};
