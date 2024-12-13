import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  if (!fileId) {
    throw new Error('Missing userId');
  }

  const document = dbClient.client
    .db()
    .collection('files')
    .findOne({ _id: new ObjectId(fileId), userId: userId });
  if (!document) {
    throw new Error('File not found');
  }

  const localPath = document.localPath;
  try {
    for (const size of [500, 250, 100]) {
      const thumbnail = await imageThumbnail(localPath, { width: size });
      const thumbnailPath = `${localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }
  } catch (error) {
    console.error(`Error generating thumbnails: ${error.message}`);
    throw error;
  }
});


// Create Bull queue for users
const userQueue = new Bull('userQueue');

// Process the userQueue
userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the user from the database
  const user = await dbClient.client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) });

  if (!user) {
    throw new Error('User not found');
  }

  // Simulate sending a welcome email
  console.log(`Welcome ${user.email}!`);
});