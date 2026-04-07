const { Pool } = require('pg');

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is missing');
  // In production, we might want to exit, but for dev we'll just log
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: SSL for production
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Simple retry logic for initial connection or critical queries could be added here
// For now, the pool handles reconnection attempts automatically

/**
 * Execute a query with logging and error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Array of rows
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (err) {
    console.error('error executing query', { text, err });
    throw err;
  }
};

/**
 * Example Usage:
 * 
 * const db = require('./client');
 * 
 * async function getUser(id) {
 *   const rows = await db.query('SELECT * FROM users WHERE id = $1', [id]);
 *   return rows[0];
 * }
 */

module.exports = {
  query,
  pool // Export pool if direct access is needed (e.g. for transactions)
};
