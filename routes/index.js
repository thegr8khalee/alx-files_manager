import express from 'express';
import { getStats, getStatus } from '../controllers/AppController.js';
import { postNew } from '../controllers/UsersController.js';
import { getConnect } from '../controllers/AuthController.js';
import { getDisconnect } from '../controllers/AuthController.js';
import { getMe } from '../controllers/UsersController.js';

const router = express.Router();

// Define the routes
router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);

export default router;
