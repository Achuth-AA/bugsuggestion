const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 } = require('uuid');
const { pool }       = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { invalidateRideCache }     = require('../services/cache');
const { notifyRideBooked, notifyRideCancelled } = require('../services/sns');

const bookSchema = Joi.object({
  ride_id:      Joi.string().uuid().required(),
  seats_booked: Joi.number().integer().min(1).required(),
});

// POST /bookings — rider books a seat
router.post('/', authenticate, authorize('rider'), async (req, res, next) => {
  const conn = await pool.connect();
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { ride_id, seats_booked } = value;

    await conn.query('BEGIN');

    const { rows: rides } = await conn.query(
      'SELECT * FROM rides WHERE ride_id = $1 AND status = $2 FOR UPDATE',
      [ride_id, 'active']
    );

    if (!rides.length) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Ride not found or no longer active' });
    }

    const ride = rides[0];

    if (ride.driver_id === req.user.user_id) {
      await conn.query('ROLLBACK');
      return res.status(400).json({ error: 'Drivers cannot book their own ride' });
    }

    if (ride.seats_available < seats_booked) {
      await conn.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${ride.seats_available} seat(s) available` });
    }

    const { rows: existing } = await conn.query(
      "SELECT booking_id FROM bookings WHERE ride_id = $1 AND user_id = $2 AND status = 'confirmed'",
      [ride_id, req.user.user_id]
    );
    if (existing.length) {
      await conn.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already booked this ride' });
    }

    const bookingId = uuidv4();
    await conn.query(
      'INSERT INTO bookings (booking_id, ride_id, user_id, seats_booked) VALUES ($1, $2, $3, $4)',
      [bookingId, ride_id, req.user.user_id, seats_booked]
    );

    await conn.query(
      'UPDATE rides SET seats_available = seats_available - $1 WHERE ride_id = $2',
      [seats_booked, ride_id]
    );

    await conn.query('COMMIT');

    try {
      const { rows: driverRows } = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [ride.driver_id]
      );
      await notifyRideBooked({
        driverEmail: driverRows[0]?.email,
        riderName:   req.user.name,
        riderEmail:  req.user.email,
        rideDetails: { ride_id, source: ride.source, destination: ride.destination, date: ride.date },
        seatsBooked: seats_booked,
      });
    } catch {}

    await invalidateRideCache(ride.source, ride.destination);

    res.status(201).json({ message: 'Booking confirmed', bookingId, seatsBooked: seats_booked });
  } catch (err) {
    await conn.query('ROLLBACK');
    next(err);
  } finally {
    conn.release();
  }
});

// POST /bookings/cancel — rider cancels their booking
router.post('/cancel', authenticate, authorize('rider'), async (req, res, next) => {
  const conn = await pool.connect();
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id is required' });

    await conn.query('BEGIN');

    const { rows: bookings } = await conn.query(
      `SELECT b.*, r.source, r.destination, r.driver_id
       FROM bookings b
       JOIN rides r ON b.ride_id = r.ride_id
       WHERE b.booking_id = $1 AND b.user_id = $2 AND b.status = 'confirmed'
       FOR UPDATE`,
      [booking_id, req.user.user_id]
    );

    if (!bookings.length) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Active booking not found' });
    }

    const booking = bookings[0];

    await conn.query(
      "UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1",
      [booking_id]
    );

    await conn.query(
      'UPDATE rides SET seats_available = seats_available + $1 WHERE ride_id = $2',
      [booking.seats_booked, booking.ride_id]
    );

    await conn.query('COMMIT');

    try {
      const { rows: driverRows } = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [booking.driver_id]
      );
      await notifyRideCancelled({
        driverEmail: driverRows[0]?.email,
        riderName:   req.user.name,
        riderEmail:  req.user.email,
        rideDetails: { ride_id: booking.ride_id, source: booking.source, destination: booking.destination },
        seatsBooked: booking.seats_booked,
      });
    } catch {}

    await invalidateRideCache(booking.source, booking.destination);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await conn.query('ROLLBACK');
    next(err);
  } finally {
    conn.release();
  }
});

// GET /bookings/my — rider's own bookings
router.get('/my', authenticate, authorize('rider'), async (req, res, next) => {
  try {
    const { rows: bookings } = await pool.query(
      `SELECT b.*, r.source, r.destination, r.date, r.time, r.price,
              u.name AS driver_name, u.phone AS driver_phone
       FROM bookings b
       JOIN rides r ON b.ride_id = r.ride_id
       JOIN users u ON r.driver_id = u.user_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.user_id]
    );
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// GET /bookings/ride/:rideId — driver sees who booked their ride
router.get('/ride/:rideId', authenticate, authorize('driver'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT ride_id FROM rides WHERE ride_id = $1 AND driver_id = $2',
      [req.params.rideId, req.user.user_id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Not your ride' });

    const { rows: bookings } = await pool.query(
      `SELECT b.*, u.name AS rider_name, u.email AS rider_email, u.phone AS rider_phone
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.ride_id = $1 AND b.status = 'confirmed'`,
      [req.params.rideId]
    );
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
