const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get analytics for business
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM analytics WHERE business_id = $1';
    let params = [business_id];

    if (start_date && end_date) {
      query += ' AND date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);

    // Calculate totals
    const totals = {
      total_bookings: result.rows.reduce((sum, row) => sum + row.bookings_count, 0),
      total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0),
      avg_daily_bookings: result.rows.length > 0 ? (result.rows.reduce((sum, row) => sum + row.bookings_count, 0) / result.rows.length).toFixed(2) : 0
    };

    res.json({ 
      analytics: result.rows,
      totals 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
