import express from 'express';
import loadRoutes from './routes/index.js';


const server = express();

server.use(express.json({ limit: '200mb' }));

loadRoutes(server);
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });