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
    idleTimeoutMillis: 600000, // 10 minutes idle timeout to prevent slow TLS handshakes
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Warm up initial connection immediately
pool.query('SELECT 1').catch(() => {});

pool.on('error', (err) => {
    console.error('❌ Unexpected DB pool error:', err.message);
});

module.exports = pool;
