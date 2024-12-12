// import { getMe } from './UsersController';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis.js';
import { ObjectId } from 'mongodb';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

// Ensure the folder exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

export const postUpload = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token

    const auth = await getMe(token);
    console.log('Auth: ', auth);

    if (!auth) {
      console.log('Unauthorized: No user found for token');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, type, data, parentId = 0, isPublic = false } = req.body;
    console.log('gotten req body');
    // Validate required fields
    if (!name) {
      console.log('Missing name in request body');
      return res.status(400).json({ message: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      console.log('Missing or invalid type');
      return res.status(400).json({ message: 'Missing or invalid type' });
    }

    if (type !== 'folder' && !data) {
      console.log('Missing data for file/image type');
      return res.status(400).json({ message: 'Missing data' });
    }

    // Validate parentId if provided
    if (parentId) {
      const parentFile = await dbClient.client
        .db()
        .collection('files')
        .findOne({ id: parentId });

      if (!parentFile) {
        console.log(`Parent file not found for parentId: ${parentId}`);
        return res.status(400).json({ message: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        console.log('Parent is not a folder');
        return res.status(400).json({ message: 'Parent is not a folder' });
      }
    }

    const userId = auth.id;
    console.log(userId)

    // Handle folder type (no file data required)
    if (type === 'folder') {
      const post = await dbClient.client
        .db()
        .collection('files')
        .insertOne({
          userId,
          name,
          type,
          parentId: parentId || 0, // Default to 0 for root
          isPublic,
        });

      if (!post) {
        console.log('Error uploading folder to DB');
        return res
          .status(400)
          .json({ message: 'Error uploading folder to DB' });
      }

      console.log('Folder uploaded successfully');
      return res.status(201).json({
        id: post.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    }

    // Ensure directory exists for file/image types
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileId = uuidv4();
    const filePath = path.join(folderPath, `${fileId}`);

    // Decode base64 data and save to file system
    const fileBuffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, fileBuffer);

    // Insert file metadata into DB
    const post = await dbClient.client
      .db()
      .collection('files')
      .insertOne({
        userId,
        name,
        type,
        parentId: parentId || 0, // Default to 0 if no parentId provided
        isPublic,
        localPath: filePath,
      });

    if (!post) {
      fs.unlinkSync(filePath); // Remove the file if DB insert fails
      console.log('Error uploading file to DB');
      return res.status(400).json({ message: 'Error uploading file to DB' });
    }

    console.log('File uploaded successfully');
    return res.status(201).json({
      id: post.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath,
    });
  } catch (error) {
    console.error('Error in postUpload:', error);
    return res.status(500).json({
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

const getMe = async (token) => {
  try {
    if (!token) {
      return { error: 'Token is required' };
    }

    console.log('Received Token:', token);

    const userId = await redisClient.get(`auth_${token}`);
    console.log('User ID from Redis:', userId);

    if (!userId) {
      return { error: 'Unauthorized - Invalid or expired token' };
    }

    // Convert userId to ObjectId to match MongoDB _id type
    const userObjectId = new ObjectId(userId);
    console.log('Converted User ID:', userObjectId);

    const user = await dbClient.client
      .db()
      .collection('users')
      .findOne({ _id: userObjectId });
    console.log('User from DB:', user);

    if (!user) {
      return { error: 'Unauthorized - User not found' };
    }

    return {
      id: user._id,
      email: user.email,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      message: 'Error retrieving user',
      error: error.message,
    };
  }
};


export const getShow = async(req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token

    const auth = await getMe(token);
    console.log('Auth: ', auth);

    if (!auth) {
      console.log('Unauthorized: No user found for token');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const document = await dbClient.client.db().collection('files').find({id: fileId, userId: auth.id})
    if (!document) {
      res.status(400).json({message: "Not found"})
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error('Error:', error);
    return {
      message: 'Error getting document: ',
      error: error.message,
    };
  }
}

export const getIndex = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token
    const auth = await getMe(token);
    console.log('Auth: ', auth);

    if (!auth) {
      console.log('Unauthorized: No user found for token');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Retrieve the parentId and page query parameters (defaults)
    const parentId = parseInt(req.query.parentId) || 0; // Default to root folder (0)
    const page = parseInt(req.query.page) || 0; // Default to first page

    const skip = page * 20; // Calculate skip based on page (20 items per page)
    const limit = 20; // Limit of 20 items per page

    // Query the database for the user's files, filtered by parentId and paginated
    const files = await dbClient.client
      .db()
      .collection('files')
      .aggregate([
        {
          $match: {
            userId: auth._id,
            parentId: parentId, // Filter by parentId
          },
        },
        {
          $skip: skip, // Skip the documents based on pagination
        },
        {
          $limit: limit, // Limit the number of documents returned
        },
      ])
      .toArray();

    // Return the list of files (empty if none found)
    return res.status(200).json(files);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error retrieving files',
      error: error.message,
    });
  }
};
