const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL is not set. Check backend/.env");
    process.exit(1);
}

// Local Postgres does not speak TLS by default, so SSL is opt-in.
// Set DB_SSL=true in .env when connecting to a hosted DB that requires it
// (e.g. Supabase, RDS, Render, etc).
const useSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle Postgres client', err);
});

module.exports = pool;
