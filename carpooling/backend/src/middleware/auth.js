const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { pool } = require('../config/db');

const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });

    try {
      const { rows } = await pool.query(
        'SELECT user_id, name, email, role, is_active FROM users WHERE cognito_sub = $1',
        [decoded.sub]
      );

      if (!rows.length || !rows[0].is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      req.user = rows[0];
      next();
    } catch (dbErr) {
      next(dbErr);
    }
  });
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
