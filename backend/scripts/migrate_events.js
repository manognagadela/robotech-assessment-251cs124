
import "dotenv/config";
import pool from "../db.js";

async function run() {
    try {
        console.log("Running migration...");
        await pool.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS event_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
    `);
        console.log("Columns added successfully.");
    } catch (e) {
        // Check if error is due to column already existing or connection issue
        console.error("Migration failed:", e.message);
    } finally {
        await pool.end();
    }
}

run();
