const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 } = require('uuid');
const { pool }       = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { getCachedRides, setCachedRides, invalidateRideCache } = require('../services/cache');
const { notifyRidePosted, notifyRideCancelled } = require('../services/sns');

const createRideSchema = Joi.object({
  source:          Joi.string().min(2).max(255).required(),
  destination:     Joi.string().min(2).max(255).required(),
  date:            Joi.string().isoDate().required(),
  time:            Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  seats_available: Joi.number().integer().min(1).max(20).required(),
  price:           Joi.number().min(0).required(),
  notes:           Joi.string().max(500).optional(),
});

// GET /rides/search — public, cached
router.get('/search', async (req, res, next) => {
  try {
    const filters = {
      source:      req.query.source || '',
      destination: req.query.destination || '',
      date:        req.query.date || '',
      minPrice:    req.query.minPrice || '',
      maxPrice:    req.query.maxPrice || '',
    };

    const cached = await getCachedRides(filters);
    if (cached) return res.json({ rides: cached, source: 'cache' });

    let query = `
      SELECT r.*, u.name AS driver_name, u.profile_photo_url AS driver_photo,
             u.phone AS driver_phone
      FROM rides r
      JOIN users u ON r.driver_id = u.user_id
      WHERE r.status = 'active' AND r.seats_available > 0
    `;
    const params = [];
    let pi = 1;

    if (filters.source) {
      query += ` AND LOWER(r.source) LIKE $${pi}`;
      params.push(`%${filters.source.toLowerCase()}%`);
      pi++;
    }
    if (filters.destination) {
      query += ` AND LOWER(r.destination) LIKE $${pi}`;
      params.push(`%${filters.destination.toLowerCase()}%`);
      pi++;
    }
    if (filters.date) {
      query += ` AND r.date = $${pi}`;
      params.push(filters.date);
      pi++;
    }
    if (filters.minPrice) {
      query += ` AND r.price >= $${pi}`;
      params.push(parseFloat(filters.minPrice));
      pi++;
    }
    if (filters.maxPrice) {
      query += ` AND r.price <= $${pi}`;
      params.push(parseFloat(filters.maxPrice));
      pi++;
    }

    query += ' ORDER BY r.date ASC, r.time ASC LIMIT 50';

    const { rows: rides } = await pool.query(query, params);
    await setCachedRides(filters, rides);

    res.json({ rides, source: 'db' });
  } catch (err) {
    next(err);
  }
});

// POST /rides — driver only
router.post('/', authenticate, authorize('driver'), async (req, res, next) => {
  try {
    const { error, value } = createRideSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideId = uuidv4();
    const { source, destination, date, time, seats_available, price, notes } = value;

    await pool.query(
      `INSERT INTO rides (ride_id, driver_id, source, destination, date, time,
        seats_available, seats_total, price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [rideId, req.user.user_id, source, destination, date, time,
       seats_available, seats_available, price, notes || null]
    );

    await invalidateRideCache(source, destination);

    try {
      await notifyRidePosted({
        driverName:  req.user.name,
        rideDetails: { rideId, source, destination, date, time, seats_available, price },
      });
    } catch {}

    res.status(201).json({ message: 'Ride posted successfully', rideId });
  } catch (err) {
    next(err);
  }
});

// GET /rides/driver/my — must be before /:rideId to avoid param shadowing
router.get('/driver/my', authenticate, authorize('driver'), async (req, res, next) => {
  try {
    const { rows: rides } = await pool.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.ride_id AND b.status = 'confirmed')
          AS total_bookings
       FROM rides r
       WHERE r.driver_id = $1
       ORDER BY r.date DESC`,
      [req.user.user_id]
    );
    res.json({ rides });
  } catch (err) {
    next(err);
  }
});

// GET /rides/:rideId
router.get('/:rideId', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS driver_name, u.profile_photo_url AS driver_photo,
              u.phone AS driver_phone, u.email AS driver_email
       FROM rides r
       JOIN users u ON r.driver_id = u.user_id
       WHERE r.ride_id = $1`,
      [req.params.rideId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Ride not found' });
    res.json({ ride: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /rides/:rideId/cancel — driver cancels their ride
router.patch('/:rideId/cancel', authenticate, authorize('driver'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM rides WHERE ride_id = $1 AND driver_id = $2',
      [req.params.rideId, req.user.user_id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Ride not found' });
    if (rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Ride is not active' });
    }

    await pool.query(
      "UPDATE rides SET status = 'cancelled' WHERE ride_id = $1",
      [req.params.rideId]
    );

    await invalidateRideCache(rows[0].source, rows[0].destination);

    try {
      const { rows: bookedRiders } = await pool.query(
        `SELECT b.seats_booked, u.email, u.name
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         WHERE b.ride_id = $1 AND b.status = 'confirmed'`,
        [req.params.rideId]
      );
      for (const rider of bookedRiders) {
        try {
          await notifyRideCancelled({
            driverEmail: req.user.email,
            riderName:   rider.name,
            riderEmail:  rider.email,
            rideDetails: {
              ride_id:     req.params.rideId,
              source:      rows[0].source,
              destination: rows[0].destination,
            },
            seatsBooked: rider.seats_booked,
          });
        } catch {}
      }
    } catch {}

    res.json({ message: 'Ride cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
