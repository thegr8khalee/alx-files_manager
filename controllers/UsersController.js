//import redisClient from '../utils/redis.js'; // Import Redis client
import dbClient from '../utils/db.js'; // Import DB client
import bcrypt from 'bcrypt';
import redisClient from '../utils/redis.js';
import { ObjectId } from 'mongodb';

export const postNew = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const db = dbClient.client.db();
    // const redis = redisClient;

    const checkEmail = await db.collection('users').findOne({ email });
    if (checkEmail) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const saltRounds = 10;
    const SHA1 = await bcrypt.hash(password, saltRounds);

    const newUser = {
      email,
      password: SHA1,
    };

    const result = await db.collection('users').insertOne(newUser);
    return res.status(201).json({
      id: result.insertedId.toString(),
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating user',
      error: error.message,
    });
  }
};

// const { ObjectId } = require('mongodb'); // Make sure to import ObjectId from MongoDB

export const getMe = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('Received Token:', token);

    const userId = await redisClient.get(`auth_${token}`);
    console.log('User ID from Redis:', userId);

    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Unauthorized - Invalid or expired token' });
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
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};
