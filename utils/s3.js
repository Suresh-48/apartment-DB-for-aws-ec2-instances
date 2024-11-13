import AWS from "aws-sdk";

import path from "path";
import mime from 'mime-types'; 

// Config File
import {
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsBucketName,
} from "../config.js";

/**
 * Update AWS Config
 */

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
});

const s3 = new AWS.S3();

/**
 * Get Public Image Url
 *
 * @param {*} filePath
 * @returns
 */

export function getPublicImageUrl(filePath) {
  return `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com/${filePath}`;
}

/**
 * Upload Base64 To File
 *
 * @param base64
 * @param newPath
 * @param callback
 */

export function uploadBase64File(base64, newPath, callback) {
  const buffer = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
    ACL: "public-read",
  };
  
  const extension = path.extname(newPath);

  const newFilePath = `${path.basename(newPath, extension)}${extension}`;

  params.Key = newFilePath;

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}

// Use mime-types package to get content types from extensions

export function uploadDocstoAws(base64, newPath, callback) {
  const base64Data = base64.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  // Detect the file extension and content type
  const extension = path.extname(newPath);
  const contentType = mime.lookup(extension) || 'application/octet-stream';

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentEncoding: 'base64',
    ContentType: contentType,
    ACL: 'public-read',
  };

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}



export function uploadFilestoAws(file, newPath, callback) {
  const buffer = file.buffer;

  // Detect the file extension and content type
  const extension = path.extname(newPath);
  const contentType = mime.lookup(extension) || 'application/octet-stream';

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  };

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}


export async function uploadOneFile(file) { 
  if (file && file.fileName && file.fileData) {
      try {
          const base64Data = file.fileData;
          const fileType = base64Data.split(";")[0].split("/")[1];
          const newFileName = file.fileName;
          const newFilePath = newFileName;

          return new Promise((resolve, reject) => {
              uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
                  if (err) {
                      return reject(err);
                  }

                  resolve({
                      documentName: newFileName,
                      documentPath: getPublicImageUrl(mediaPath),
                      documentType: fileType,
                      createdAt: new Date(),
                  });
              });
          });
      } catch (error) {
          throw new Error("File upload failed: " + error.message);
      }
  } else {
      throw new Error("Missing file name or data");
  }
}