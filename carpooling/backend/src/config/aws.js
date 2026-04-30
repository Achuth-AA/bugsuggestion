const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client }   = require('@aws-sdk/client-s3');
const { SNSClient }  = require('@aws-sdk/client-sns');
const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');

const awsConfig = {
  region:      process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const cognitoClient   = new CognitoIdentityProviderClient(awsConfig);
const s3Client        = new S3Client(awsConfig);
const snsClient       = new SNSClient(awsConfig);
const cloudwatchClient = new CloudWatchClient(awsConfig);

module.exports = { cognitoClient, s3Client, snsClient, cloudwatchClient };
