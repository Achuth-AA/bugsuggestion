/**
 * SNS Topics Setup for Carpooling Platform
 * Run: node infrastructure/sns-setup.js
 */
require('dotenv').config({ path: '../backend/.env' });
const { SNSClient, CreateTopicCommand, SetTopicAttributesCommand } = require('@aws-sdk/client-sns');

const client = new SNSClient({ region: process.env.AWS_REGION });

async function createTopics() {
  const topics = [
    { Name: 'carpooling-bookings',      DisplayName: 'Carpooling Bookings' },
    { Name: 'carpooling-cancellations', DisplayName: 'Carpooling Cancellations' },
  ];

  for (const topic of topics) {
    try {
      const res = await client.send(new CreateTopicCommand({ Name: topic.Name }));
      console.log(`Created SNS topic: ${topic.Name}`);
      console.log(`  ARN: ${res.TopicArn}`);

      await client.send(new SetTopicAttributesCommand({
        TopicArn:       res.TopicArn,
        AttributeName:  'DisplayName',
        AttributeValue: topic.DisplayName,
      }));
    } catch (err) {
      console.error(`Failed to create topic ${topic.Name}:`, err.message);
    }
  }

  console.log('\nAdd the ARNs above to your .env as:');
  console.log('SNS_TOPIC_ARN_BOOKINGS=...');
  console.log('SNS_TOPIC_ARN_CANCELLATIONS=...');
}

createTopics();
