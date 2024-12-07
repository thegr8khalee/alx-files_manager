//import redisClient from '../utils/redis.js'; // Import Redis client
import dbClient from '../utils/db.js'; // Import DB client
import bcrypt from 'bcrypt';

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

    const db = dbClient;
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

export const getMe = async (req, res) => {
  try {
    const token = req.headers['x-token'];

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      res.status(401).json({ error: ' Unauthorized' });
    }

    const user = await dbClient.collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};
