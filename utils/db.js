import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(dbURL);
    this.connected = false;
    this.init(); // Initialize connection asynchronously
  }

  async init() {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('Database connected!');
    } catch (err) {
      console.error('Error connecting to the database:', err);
      this.connected = false;
    }
  }

  async isAlive() {
    if (!this.connected) return false;
    try {
      await this.client.db().command({ ping: 1 });
      return true;
    } catch (err) {
      console.error('Database is not alive:', err);
      return false;
    }
  }

  async nbUsers() {
    if (!this.connected) {
      console.error('Cannot fetch user count, database not connected.');
      return 0;
    }
    try {
      return await this.client.db().collection('users').countDocuments();
    } catch (err) {
      console.error('Error fetching users count:', err);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.connected) {
      console.error('Cannot fetch files count, database not connected.');
      return 0;
    }
    try {
      return await this.client.db().collection('files').countDocuments();
    } catch (err) {
      console.error('Error fetching files count:', err);
      return 0;
    }
  }

  async close() {
    if (this.connected) {
      try {
        await this.client.close();
        this.connected = false;
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
}

export const dbClient = new DBClient();
export default dbClient;
