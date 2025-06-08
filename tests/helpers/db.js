const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.NODE_ENV === 'test' 
    ? (process.env.TEST_DB_NAME || process.env.DB_NAME || 'cv-matcher')
    : (process.env.DB_NAME || 'cv-matcher'),
  user: process.env.NODE_ENV === 'test'
    ? (process.env.TEST_DB_USER || process.env.DB_USER || 'postgres')
    : (process.env.DB_USER || 'postgres'),
  password: process.env.NODE_ENV === 'test'
    ? (process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '6731')
    : (process.env.DB_PASSWORD || '6731'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool = null;

/**
 * Get database connection pool
 */
function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

/**
 * Execute a query
 */
async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Close all connections
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('Database connection successful');
    console.log('Server time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Helper function to set current user for RLS
 */
async function setCurrentUser(userId) {
  if (userId) {
    await query("SELECT set_config('app.current_user_id', $1, false)", [userId]);
  } else {
    await query("SELECT set_config('app.current_user_id', '', false)");
  }
}

/**
 * Helper function to clear current user
 */
async function clearCurrentUser() {
  await setCurrentUser(null);
}

module.exports = {
  query,
  getClient,
  getPool,
  close,
  testConnection,
  setCurrentUser,
  clearCurrentUser,
  dbConfig
};