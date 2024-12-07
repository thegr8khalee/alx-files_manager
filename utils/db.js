import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(dbURL);
    this.connect();
  }

  // Asynchronously connect to the database
  async connect() {
    try {
      await this.client.connect();
      console.log('Database connected!');
    } catch (err) {
      console.error('Error connecting to the database:', err);
    }
  }

  // Check if the database connection is alive
  async isAlive() {
    try {
      await this.client.db().command({ ping: 1 });
      return true; // If ping succeeds, the database is alive
    } catch (err) {
      console.error('Database is not alive:', err);
      return false;
    }
  }

  // Get the number of users in the "users" collection
  async nbUsers() {
    try {
      return await this.client.db().collection('users').countDocuments();
    } catch (err) {
      console.error('Error fetching users count:', err);
      return 0;
    }
  }

  // Get the number of files in the "files" collection
  async nbFiles() {
    try {
      return await this.client.db().collection('files').countDocuments();
    } catch (err) {
      console.error('Error fetching files count:', err);
      return 0;
    }
  }

  // Close the database connection
  async close() {
    try {
      await this.client.close();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

export const dbClient = new DBClient();
export default dbClient;
