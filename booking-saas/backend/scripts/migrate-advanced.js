const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('Running advanced schema migration...');

    // Read migration SQL
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrate-advanced.sql'), 'utf8');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Advanced schema migration completed successfully');

    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('team_members', 'invoices', 'customer_reviews', 'trials', 'api_usage', 'integrations')
    `);

    console.log(`\n📊 Created tables: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

    await pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
