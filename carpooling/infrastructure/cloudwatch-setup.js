/**
 * CloudWatch Alarms Setup for Carpooling Platform
 * Run: node infrastructure/cloudwatch-setup.js
 */
require('dotenv').config({ path: '../backend/.env' });
const { CloudWatchClient, PutMetricAlarmCommand } = require('@aws-sdk/client-cloudwatch');

const client = new CloudWatchClient({ region: process.env.AWS_REGION });
const SNS_ALARM_ARN = process.env.SNS_TOPIC_ARN_BOOKINGS;

const alarms = [
  {
    AlarmName:          'CarpoolingAPI-HighCPU',
    MetricName:         'CPUUtilization',
    Namespace:          'AWS/EC2',
    Statistic:          'Average',
    Period:             300,
    EvaluationPeriods:  2,
    Threshold:          80,
    ComparisonOperator: 'GreaterThanThreshold',
    AlarmDescription:   'EC2 CPU > 80% for 10 min',
    AlarmActions:       [SNS_ALARM_ARN],
  },
  {
    AlarmName:          'CarpoolingDB-HighConnections',
    MetricName:         'DatabaseConnections',
    Namespace:          'AWS/RDS',
    Statistic:          'Average',
    Period:             300,
    EvaluationPeriods:  1,
    Threshold:          80,
    ComparisonOperator: 'GreaterThanThreshold',
    AlarmDescription:   'RDS connections > 80',
    AlarmActions:       [SNS_ALARM_ARN],
  },
  {
    AlarmName:          'CarpoolingCache-HighEvictions',
    MetricName:         'Evictions',
    Namespace:          'AWS/ElastiCache',
    Statistic:          'Sum',
    Period:             300,
    EvaluationPeriods:  1,
    Threshold:          100,
    ComparisonOperator: 'GreaterThanThreshold',
    AlarmDescription:   'Redis evictions > 100 per 5 min',
    AlarmActions:       [SNS_ALARM_ARN],
  },
  {
    AlarmName:          'CarpoolingAPI-5xxErrors',
    MetricName:         'HTTPCode_Target_5XX_Count',
    Namespace:          'AWS/ApplicationELB',
    Statistic:          'Sum',
    Period:             60,
    EvaluationPeriods:  3,
    Threshold:          10,
    ComparisonOperator: 'GreaterThanThreshold',
    AlarmDescription:   'More than 10 5xx errors in 3 minutes',
    AlarmActions:       [SNS_ALARM_ARN],
  },
];

async function createAlarms() {
  for (const alarm of alarms) {
    try {
      await client.send(new PutMetricAlarmCommand(alarm));
      console.log(`Created alarm: ${alarm.AlarmName}`);
    } catch (err) {
      console.error(`Failed to create ${alarm.AlarmName}:`, err.message);
    }
  }
}

createAlarms();
