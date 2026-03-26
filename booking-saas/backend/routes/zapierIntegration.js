const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Zapier trigger: New booking created
router.post('/zapier/new-booking', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token !== process.env.ZAPIER_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { business_id } = req.body;

    // Get latest booking
    const result = await pool.query(
      'SELECT * FROM bookings WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1',
      [business_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No bookings found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Zapier integration failed' });
  }
});

// Zapier trigger: New customer
router.post('/zapier/new-customer', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token !== process.env.ZAPIER_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { business_id } = req.body;

    // Get latest new customer (from bookings)
    const result = await pool.query(
      'SELECT DISTINCT customer_name, customer_email, customer_phone FROM bookings WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1',
      [business_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No customers found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Zapier integration failed' });
  }
});

// Zapier trigger: Revenue milestone
router.post('/zapier/revenue-milestone', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token !== process.env.ZAPIER_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { business_id, milestone } = req.body;

    // Calculate revenue
    const result = await pool.query(
      `SELECT SUM(s.price) as total_revenue, COUNT(b.id) as booking_count
       FROM bookings b 
       JOIN services s ON b.service_id = s.id 
       WHERE b.business_id = $1 AND b.status = 'confirmed'`,
      [business_id]
    );

    const revenue = result.rows[0]?.total_revenue || 0;

    if (revenue >= milestone) {
      return res.json({
        milestone_reached: true,
        current_revenue: revenue,
        milestone_target: milestone
      });
    }

    res.json({
      milestone_reached: false,
      current_revenue: revenue,
      milestone_target: milestone
    });
  } catch (err) {
    res.status(500).json({ error: 'Zapier integration failed' });
  }
});

// Zapier action: Create booking via Zapier
router.post('/zapier/create-booking', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token !== process.env.ZAPIER_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time } = req.body;

    const { v4: uuidv4 } = require('uuid');

    const bookingId = uuidv4();

    // Get service duration
    const serviceResult = await pool.query(
      'SELECT duration_minutes FROM services WHERE id = $1',
      [service_id]
    );

    const service = serviceResult.rows[0];
    const [hours, minutes] = start_time.split(':').map(Number);
    const endHours = Math.floor((minutes + service.duration_minutes) / 60);
    const endMinutes = (minutes + service.duration_minutes) % 60;
    const end_time = `${String(hours + endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    await pool.query(
      `INSERT INTO bookings (id, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [bookingId, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, 'confirmed']
    );

    res.status(201).json({
      success: true,
      booking_id: bookingId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking via Zapier' });
  }
});

// Zapier test endpoint
router.get('/zapier/test', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (token !== process.env.ZAPIER_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ status: 'connected' });
});

module.exports = router;
