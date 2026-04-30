const { Pool } = require('pg');
const { Signer } = require('@aws-sdk/rds-signer');

const signer = new Signer({
  hostname: process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  region:   process.env.AWS_REGION,
  username: process.env.DB_USER,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: () => signer.getAuthToken(), // auto-refreshes IAM token per connection
  max:      10,
  ssl:      { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Aurora PostgreSQL connected (IAM auth)');
    client.release();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
