const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient } = require('../config/aws');

async function publishNotification(topicArn, subject, message) {
  const command = new PublishCommand({
    TopicArn: topicArn,
    Subject:  subject,
    Message:  typeof message === 'string' ? message : JSON.stringify(message),
  });
  return snsClient.send(command);
}

async function notifyRideBooked({ driverEmail, riderName, riderEmail, rideDetails, seatsBooked }) {
  const bookingTopic = process.env.SNS_TOPIC_ARN_BOOKINGS;

  await publishNotification(bookingTopic, 'New Ride Booking', {
    type:        'BOOKING_CREATED',
    driver:      { email: driverEmail },
    rider:       { name: riderName, email: riderEmail },
    ride:        rideDetails,
    seatsBooked,
    timestamp:   new Date().toISOString(),
  });
}

async function notifyRideCancelled({ driverEmail, riderName, riderEmail, rideDetails, seatsBooked }) {
  const cancelTopic = process.env.SNS_TOPIC_ARN_CANCELLATIONS;

  await publishNotification(cancelTopic, 'Booking Cancelled', {
    type:        'BOOKING_CANCELLED',
    driver:      { email: driverEmail },
    rider:       { name: riderName, email: riderEmail },
    ride:        rideDetails,
    seatsBooked,
    timestamp:   new Date().toISOString(),
  });
}

async function notifyRidePosted({ driverName, rideDetails }) {
  const bookingTopic = process.env.SNS_TOPIC_ARN_BOOKINGS;

  await publishNotification(bookingTopic, 'New Ride Available', {
    type:       'RIDE_POSTED',
    driver:     { name: driverName },
    ride:       rideDetails,
    timestamp:  new Date().toISOString(),
  });
}

module.exports = { notifyRideBooked, notifyRideCancelled, notifyRidePosted };
