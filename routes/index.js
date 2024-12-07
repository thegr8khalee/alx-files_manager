import express from 'express';
import { getStats, getStatus } from '../controllers/AppController';

const router = express.Router();

// Define the routes
router.get('/status', getStatus);
router.get('/stats', getStats);

export default router;
