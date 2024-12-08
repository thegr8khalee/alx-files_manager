import mongoose from 'mongoose';
import dotenv from 'dotenv';     // Import dotenv

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;
    this.connection = mongoose.createConnection(uri);

    this.connection.on('connected', () => {
      console.log(`Connected to MongoDB at ${uri}`);
    });

    this.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  }

  // Check if MongoDB connection is alive
  isAlive() {
    return this.connection.readyState === 1; // 1 means connected
  }

  // Get the number of users in the users collection
  async nbUsers() {
    try {
      const usersCollection = this.connection.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  // Get the number of files in the files collection
  async nbFiles() {
    try {
      const filesCollection = this.connection.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

// Create and export an instance of DBClient
export const dbClient = new DBClient();
export default dbClient;
