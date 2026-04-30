const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { pool }  = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadProfilePhoto, getPresignedUploadUrl, deleteProfilePhoto } = require('../services/s3');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// GET /users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, name, email, role, phone, profile_photo_url, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const params  = [];
    let pi = 1;

    if (name)  { updates.push(`name = $${pi}`);  params.push(name);  pi++; }
    if (phone) { updates.push(`phone = $${pi}`); params.push(phone); pi++; }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.user.user_id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = $${pi}`, params);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

// POST /users/me/photo — upload profile photo to S3
router.post('/me/photo', authenticate, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { rows } = await pool.query(
      'SELECT profile_photo_url FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (rows[0]?.profile_photo_url) {
      try { await deleteProfilePhoto(rows[0].profile_photo_url); } catch {}
    }

    const photoUrl = await uploadProfilePhoto(req.file.buffer, req.file.mimetype, req.user.user_id);
    await pool.query(
      'UPDATE users SET profile_photo_url = $1 WHERE user_id = $2',
      [photoUrl, req.user.user_id]
    );

    res.json({ message: 'Photo uploaded', photoUrl });
  } catch (err) {
    next(err);
  }
});

// GET /users/me/photo-upload-url — presigned S3 URL for direct upload
router.get('/me/photo-upload-url', authenticate, async (req, res, next) => {
  try {
    const mimeType = req.query.mimeType || 'image/jpeg';
    const { signedUrl, publicUrl } = await getPresignedUploadUrl(req.user.user_id, mimeType);
    res.json({ signedUrl, publicUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
