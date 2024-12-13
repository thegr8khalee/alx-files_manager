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
