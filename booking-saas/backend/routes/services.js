const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get all services
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM services WHERE business_id = $1 AND active = true ORDER BY created_at DESC',
      [business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { business_id, name, description, duration_minutes, price, color } = req.body;
    const id = uuidv4();

    await pool.query(
      'INSERT INTO services (id, business_id, name, description, duration_minutes, price, color) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, business_id, name, description, duration_minutes || 60, price, color || '#3498db']
    );

    res.status(201).json({ 
      message: 'Service created',
      service_id: id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, price, active } = req.body;

    await pool.query(
      'UPDATE services SET name=$1, description=$2, duration_minutes=$3, price=$4, active=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6',
      [name, description, duration_minutes, price, active, id]
    );

    res.json({ message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE services SET active = false WHERE id = $1', [id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
