//import redisClient from '../utils/redis.js'; // Import Redis client
import dbClient from '../utils/db.js'; // Import DB client
import bcrypt from 'bcrypt';

export const postNew = async (req, res) => {
  try {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    const db = dbClient;
    // const redis = redisClient;

    const checkEmail = db.collection('users').findOne({ email });
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
      id: result.insertedId,
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating user',
      error: error.message,
    });
  }
};
