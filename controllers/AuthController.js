// import BasicAuth from './auth/basicAuth';
// // import dbClient from '../utils/db';
// import { v4 as uuidv4 } from 'uuid';
// import redisClient from '../utils/redis';

// export const getConnect = async (req, res) => {
//   try {
//     const basicAuth = new BasicAuth();
//     const { user } = BasicAuth.currentUser(req);
//     if (!user) {
//       res.status(401).json({ error: 'Unauthorized' });
//     }

//     const token = uuidv4();

//     await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
//     res.status(200).json({ token });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error connecting user',
//       error: error.message,
//     });
//   }
// };

// export const getDisconnect = async (req, res) => {
//   try {
//     const token = req.headers['x-token'];

//     const result = await redisClient.del(`auth_${token}`);

//     if (result === 0) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     return res.status(204).send();
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error disconnecting',
//       error: error.message,
//     });
//   }
// };

// // export const getMe = async (req, res) => {
// //   try {
// //     const token = req.headers['x-token'];

// //     const user = await redisClient.get(`auth_${token}`);

// //     if (!user) {
// //       res.status(401).json({ error: ' Unauthorized' });
// //     }
// //     res.status(201).send(user.id, user.email);
// //   } catch (error) {
// //     res.status(500).json({
// //       message: 'Error getting User',
// //       error: error.message,
// //     });
// //   }
// // };
