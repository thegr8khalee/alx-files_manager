import express from 'express';
import loadRoutes from './routes/index.js';


const server = express();

server.use(express.json({ limit: '200mb' }));

loadRoutes(server);
const PORT = process.env.PORT || 5000;

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
  });