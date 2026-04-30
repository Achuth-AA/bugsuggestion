const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.S3_BUCKET_NAME;

async function uploadProfilePhoto(fileBuffer, mimeType, userId) {
  const key = `profile-photos/${userId}/${uuidv4()}`;
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        fileBuffer,
    ContentType: mimeType,
    ACL:         'public-read',
  });

  await s3Client.send(command);
  return `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

async function deleteProfilePhoto(photoUrl) {
  const url = new URL(photoUrl);
  const key = url.pathname.slice(1);

  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
}

async function getPresignedUploadUrl(userId, mimeType) {
  const key = `profile-photos/${userId}/${uuidv4()}`;
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: mimeType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  return { signedUrl, publicUrl };
}

module.exports = { uploadProfilePhoto, deleteProfilePhoto, getPresignedUploadUrl };
