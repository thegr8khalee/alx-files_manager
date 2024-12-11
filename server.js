import express from 'express';
import routes from './routes/index.js';

const app = express();

// Use JSON middleware
app.use(express.json());

// Load routes
app.use(routes);

// Set the port from the environment variable or default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
