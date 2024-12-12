import BasicAuth from './basicAuth';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import bcrypt from 'bcrypt';

export const getConnect = async (req, res) => {
  try {
    const { email, password } = BasicAuth.currentUser(req);

    console.log(email, password);

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Fetch user from the database
    const user = await dbClient.client
      .db()
      .collection('users')
      .findOne({ email });
    console.log(user.password);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = uuidv4();

    // Save the token in Redis with an expiry time of 24 hours
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({
      message: 'Error connecting user',
      error: error.message,
    });
  }
};

export const getDisconnect = async (req, res) => {
  try {
    const token = req.headers['x-token'];

    const result = await redisClient.del(`auth_${token}`);
    if (result === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      message: 'Error disconnecting',
      error: error.message,
    });
  }
};

// export const getMe = async (req, res) => {
//   try {
//     const token = req.headers['x-token'];

//     const user = await redisClient.get(`auth_${token}`);
//     if (!user) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     return res.status(200).json({ id: user.id, email: user.email });
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Error getting user',
//       error: error.message,
//     });
//   }
// };
