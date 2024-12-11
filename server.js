import express from 'express';
import router from './routes/index.js'

const app = express();

// Use JSON middleware
app.use(express.json());

// Load routes
app.use(router);

// Set the port from the environment variable or default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
