import { Express } from 'express';
import { getStats, getStatus } from '../controllers/AppController.js';
import { postNew } from '../controllers/UsersController.js';
import { getConnect } from '../controllers/AuthController.js';
import { getDisconnect } from '../controllers/AuthController.js';
import { getMe } from '../controllers/UsersController.js';
import { postUpload, getShow, getIndex } from '../controllers/FilesController.js';



const loadRoutes = (api) => {
  api.get('/status', getStatus);
  api.get('/stats', getStats);
  api.post('/users', postNew);
  api.get('/connect', getConnect);
  api.get('/disconnect', getDisconnect);
  api.get('/users/me', getMe);
  api.post('/files', postUpload);
  api.get('/files/:id', getShow);
  api.get('/files', getIndex);
};

export default loadRoutes;
