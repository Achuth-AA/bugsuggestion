/**
 * S3 Bucket Setup for Profile Photos
 * Run: node infrastructure/s3-setup.js
 */
require('dotenv').config({ path: '../backend/.env' });
const {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutPublicAccessBlockCommand,
} = require('@aws-sdk/client-s3');

const client = new S3Client({ region: process.env.S3_REGION });
const BUCKET = process.env.S3_BUCKET_NAME;

async function setupBucket() {
  try {
    await client.send(new CreateBucketCommand({
      Bucket:                    BUCKET,
      CreateBucketConfiguration: { LocationConstraint: process.env.S3_REGION },
    }));
    console.log(`Created S3 bucket: ${BUCKET}`);
  } catch (err) {
    if (err.name === 'BucketAlreadyOwnedByYou') {
      console.log(`Bucket already exists: ${BUCKET}`);
    } else {
      console.error('Bucket creation failed:', err.message);
      return;
    }
  }

  await client.send(new PutPublicAccessBlockCommand({
    Bucket: BUCKET,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls:       false,
      IgnorePublicAcls:      false,
      BlockPublicPolicy:     false,
      RestrictPublicBuckets: false,
    },
  }));

  await client.send(new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST'],
        AllowedOrigins: ['*'],
        MaxAgeSeconds:  3600,
      }],
    },
  }));

  console.log('S3 bucket configured with CORS');
}

setupBucket();
