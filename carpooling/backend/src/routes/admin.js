const express = require('express');
const router  = express.Router();
const { pool }     = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { getCachedStats, setCachedStats } = require('../services/cache');

router.use(authenticate, authorize('admin'));

// GET /admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const cached = await getCachedStats();
    if (cached) return res.json({ stats: cached, source: 'cache' });

    const [r1, r2, r3, r4, r5] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) AS total FROM rides'),
      pool.query("SELECT COUNT(*) AS total FROM rides WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) AS total FROM bookings'),
      pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status = 'confirmed'"),
    ]);

    const { rows: roleBreakdown } = await pool.query(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
    );

    const { rows: recentRides } = await pool.query(
      `SELECT r.ride_id, r.source, r.destination, r.date, r.status, r.seats_available,
              u.name AS driver_name
       FROM rides r JOIN users u ON r.driver_id = u.user_id
       ORDER BY r.created_at DESC LIMIT 10`
    );

    const { rows: recentBookings } = await pool.query(
      `SELECT b.booking_id, b.seats_booked, b.status, b.created_at,
              r.source, r.destination, u.name AS rider_name
       FROM bookings b
       JOIN rides r ON b.ride_id = r.ride_id
       JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC LIMIT 10`
    );

    const stats = {
      totalUsers:        parseInt(r1.rows[0].total),
      totalRides:        parseInt(r2.rows[0].total),
      activeRides:       parseInt(r3.rows[0].total),
      totalBookings:     parseInt(r4.rows[0].total),
      confirmedBookings: parseInt(r5.rows[0].total),
      roleBreakdown:     roleBreakdown.map((r) => ({ ...r, count: parseInt(r.count) })),
      recentRides,
      recentBookings,
    };

    await setCachedStats(stats);
    res.json({ stats, source: 'db' });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { rows: users } = await pool.query(
      'SELECT user_id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const { rows: [{ total }] } = await pool.query('SELECT COUNT(*) AS total FROM users');

    res.json({ users, pagination: { page, limit, total: parseInt(total), pages: Math.ceil(parseInt(total) / limit) } });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/users/:userId/deactivate
router.patch('/users/:userId/deactivate', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [req.params.userId]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/users/:userId/activate
router.patch('/users/:userId/activate', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_active = true WHERE user_id = $1', [req.params.userId]);
    res.json({ message: 'User activated' });
  } catch (err) {
    next(err);
  }
});

// GET /admin/rides
router.get('/rides', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const params = [];
    let pi = 1;
    let query = `SELECT r.*, u.name AS driver_name, u.email AS driver_email
                 FROM rides r JOIN users u ON r.driver_id = u.user_id`;
    if (status) { query += ` WHERE r.status = $${pi}`; params.push(status); pi++; }
    query += ` ORDER BY r.created_at DESC LIMIT $${pi} OFFSET $${pi + 1}`;
    params.push(limit, offset);

    const { rows: rides } = await pool.query(query, params);

    const countParams = status ? [status] : [];
    const countQuery  = status
      ? 'SELECT COUNT(*) AS total FROM rides WHERE status = $1'
      : 'SELECT COUNT(*) AS total FROM rides';
    const { rows: [{ total }] } = await pool.query(countQuery, countParams);

    res.json({ rides, pagination: { page, limit, total: parseInt(total), pages: Math.ceil(parseInt(total) / limit) } });
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/rides/:rideId
router.delete('/rides/:rideId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM rides WHERE ride_id = $1', [req.params.rideId]);
    res.json({ message: 'Ride deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
