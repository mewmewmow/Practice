const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get availability for a date range
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM availability WHERE business_id = $1 ORDER BY day_of_week ASC',
      [business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Set availability slots
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { business_id, day_of_week, start_time, end_time } = req.body;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO availability (id, business_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5)',
      [id, business_id, day_of_week, start_time, end_time]
    );

    res.status(201).json({ 
      message: 'Availability slot created',
      slot_id: id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create availability' });
  }
});

module.exports = router;
