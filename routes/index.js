import { Express } from 'express';
import {getStats, getStatus} from '../controllers/AppController.js';

const loadRoutes = (api) => {
  api.get('/status', getStatus);
  api.get('/stats', getStats);
};

export default loadRoutes;
