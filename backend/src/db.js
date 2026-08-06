const { Pool } = require('pg');
const path = require('path');

// Ensure environment variables are loaded if not already loaded
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("⚠️ WARNING: process.env.DATABASE_URL is not set!");
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString && connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 20, // Limit maximum client connections in shared pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('❌ Unexpected DB pool error:', err.message);
});

module.exports = pool;
