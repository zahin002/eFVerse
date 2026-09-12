const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const client = await pool.connect();
    console.log("Connected!");
    const res = await client.query("SELECT * FROM Manager");
    console.log("Managers:", JSON.stringify(res.rows, null, 2));
    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
