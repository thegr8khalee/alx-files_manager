import { MongoClient } from "mongodb";

// Connection URL
const url = 'mongodb://127.0.0.1:27017'; // Replace with your MongoDB URL
const dbName = 'files_manager'; // Replace with your database name

// Create a new MongoClient
const client = new MongoClient(url);

async function connectToDB() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB successfully');

    // Select the database
    const db = client.db(dbName);

    // Use db.collection to perform operations (e.g., find, insert, etc.)
    const collection = db.collection('your-collection-name'); // Replace with your collection name
    const docs = await collection.find({}).toArray();
    console.log(docs);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Close the connection when done
    await client.close();
  }
}

connectToDB();
clearImmediate