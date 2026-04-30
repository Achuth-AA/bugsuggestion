require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const logger      = require('./config/logger');

const authRoutes    = require('./routes/auth');
const ridesRoutes   = require('./routes/rides');
const bookingsRoutes = require('./routes/bookings');
const usersRoutes   = require('./routes/users');
const adminRoutes   = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message:  { error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth',     authRoutes);
app.use('/rides',    ridesRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/users',    usersRoutes);
app.use('/admin',    adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
