// import { getMe } from './UsersController';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getAuth } from './getAuth.js';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';

const fileQueue = new Queue('fileQueue');
const userQueue = new Bull('userQueue');

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

    const auth = await getAuth(token);
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

    const userId = new ObjectId(auth.id).toString();
    console.log(userId);

    // Handle folder type (no file data required)
    if (type === 'folder') {
      const post = await dbClient.client
        .db()
        .collection('files')
        .insertOne({
          userId: userId,
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
        userId: userId,
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

    if (type === 'image') {
      await fileQueue.add({ userId, fileId });
    }
    await userQueue.add({ userId });

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

export const getShow = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token

    const auth = await getAuth(token);
    console.log('Auth: ', auth);

    if (!auth) {
      console.log('Unauthorized: No user found for token');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.client
      .db()
      .collection('files')
      .findOne({ id: fileId, userId: auth.id });

    console.log(file);

    if (!file) {
      return res.status(404).json({ message: 'Not found' });
    }

    return res.status(200).json(file);
  } catch (error) {
    console.error('Error:', error);
    return {
      message: 'Error getting document: ',
      error: error.message,
    };
  }
};

export const getIndex = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token
    const auth = await getAuth(token);
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

export const putPublish = async (req, res) => {
  try {
    const token = req.headers['x-token'];

    // Retrieve user based on token
    const auth = await getAuth(token);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const fileId = req.params.id;

    let objectId;
    try {
      objectId = new ObjectId(fileId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    console.log(fileId);
    // Fetch the document by ID
    const document = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: objectId });
    console.log(document);

    if (!document) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Update the document to set `isPublic` to true
    await dbClient.client
      .db()
      .collection('files')
      .updateOne({ _id: objectId }, { $set: { isPublic: true } });

    const document1 = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: objectId });
    console.log(document1);

    return res.status(200).json(document1);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error publishing file',
      error: error.message,
    });
  }
};

export const putUnpublish = async (req, res) => {
  try {
    const token = req.headers['x-token'];

    // Retrieve user based on token
    const auth = await getAuth(token);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const fileId = req.params.id;

    let objectId;
    try {
      objectId = new ObjectId(fileId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    console.log(fileId);
    // Fetch the document by ID
    const document = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: objectId });
    console.log(document);

    if (!document) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Update the document to set `isPublic` to true
    await dbClient.client
      .db()
      .collection('files')
      .updateOne({ _id: objectId }, { $set: { isPublic: false } });

    const document1 = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: objectId });
    console.log(document1);

    return res.status(200).json(document1);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error Unpublishing file',
      error: error.message,
    });
  }
};

export const getFile = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    console.log('token: ', token);

    // Retrieve user based on token
    const auth = await getAuth(token);
    console.log('Auth: ', auth);

    if (!auth) {
      console.log('Unauthorized: No user found for token');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = new ObjectId(auth.id);
    console.log(userId);
    const docId = new ObjectId(req.params.id);
    console.log('DocId: ', docId);

    const document = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: docId });
    if (!document) {
      res.status(400).json({ message: 'Not found 1' });
    }

    if ((!document.isPublic && !auth) || userId != document.userId) {
      res.status(400).json({ message: 'Not found 2' });
    }

    if (document.type == 'folder') {
      res.status(400).json({ message: "A folder doesn't have content" });
    }

    let filePath = document.localPath;
    const size = req.params.size;
    if (size) {
      if (!['500', '250', '100'].includes(size))
        return res.status(400).json({ message: 'Invalid size' });
      filePath = `${file.localPath}_${size}`;
    }
    if (!fs.existsSync(filePath)) {
      res.status(400).json({ message: 'Not found 3' });
    }

    const mimeType = mime.lookup(document.name);
    res.setHeader('Content-Type', mimeType);
    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (streamErr) => {
      return res
        .status(500)
        .json({ message: 'Error reading file', error: streamErr.message });
    });
    res.status(200);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error getting file data',
      error: error.message,
    });
  }
};

// export const postUpload = async (req, res) => {
//   try {
//     const token = req.headers['x-token'];
//     console.log('token: ', token);

//     // Retrieve user based on token

//     const auth = await getAuth(token);
//     console.log('Auth: ', auth);

//     if (!auth) {
//       console.log('Unauthorized: No user found for token');
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const { name, type, data, parentId = 0, isPublic = false } = req.body;
//     console.log('gotten req body');
//     // Validate required fields
//     if (!name) {
//       console.log('Missing name in request body');
//       return res.status(400).json({ message: 'Missing name' });
//     }

//     if (!type || !['folder', 'file', 'image'].includes(type)) {
//       console.log('Missing or invalid type');
//       return res.status(400).json({ message: 'Missing or invalid type' });
//     }

//     if (type !== 'folder' && !data) {
//       console.log('Missing data for file/image type');
//       return res.status(400).json({ message: 'Missing data' });
//     }

//     // Validate parentId if provided
//     if (parentId) {
//       const parentFile = await dbClient.client
//         .db()
//         .collection('files')
//         .findOne({ id: parentId });

//       if (!parentFile) {
//         console.log(`Parent file not found for parentId: ${parentId}`);
//         return res.status(400).json({ message: 'Parent not found' });
//       }

//       if (parentFile.type !== 'folder') {
//         console.log('Parent is not a folder');
//         return res.status(400).json({ message: 'Parent is not a folder' });
//       }
//     }

//     const userId = new ObjectId(auth.id).toString();
//     console.log(userId);

//     // Handle folder type (no file data required)
//     if (type === 'folder') {
//       const post = await dbClient.client
//         .db()
//         .collection('files')
//         .insertOne({
//           userId: userId,
//           name,
//           type,
//           parentId: parentId || 0, // Default to 0 for root
//           isPublic,
//         });

//       if (!post) {
//         console.log('Error uploading folder to DB');
//         return res
//           .status(400)
//           .json({ message: 'Error uploading folder to DB' });
//       }

//       console.log('Folder uploaded successfully');
//       return res.status(201).json({
//         id: post.insertedId,
//         userId: userId,
//         name,
//         type,
//         isPublic,
//         parentId: parentId || 0,
//       });
//     }

//     // Ensure directory exists for file/image types
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath, { recursive: true });
//     }

//     const fileId = uuidv4();
//     const filePath = path.join(folderPath, `${fileId}`);

//     // Decode base64 data and save to file system
//     const fileBuffer = Buffer.from(data, 'base64');
//     fs.writeFileSync(filePath, fileBuffer);

//     // Insert file metadata into DB
//     const post = await dbClient.client
//       .db()
//       .collection('files')
//       .insertOne({
//         userId,
//         name,
//         type,
//         parentId: parentId || 0, // Default to 0 if no parentId provided
//         isPublic,
//         localPath: filePath,
//       });

//     if (!post) {
//       fs.unlinkSync(filePath); // Remove the file if DB insert fails
//       console.log('Error uploading file to DB');
//       return res.status(400).json({ message: 'Error uploading file to DB' });
//     }

//     console.log('File uploaded successfully');
//     return res.status(201).json({
//       id: post.insertedId,
//       userId,
//       name,
//       type,
//       isPublic,
//       parentId,
//       localPath: filePath,
//     });
//   } catch (error) {
//     console.error('Error in postUpload:', error);
//     return res.status(500).json({
//       message: 'Error uploading file',
//       error: error.message,
//     });
//   }
// };
