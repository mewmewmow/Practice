const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Lazy load Stripe to handle missing env var
let stripe = null;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const { business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time } = req.body;
    const id = uuidv4();

    // Get service details
    const serviceResult = await pool.query(
      'SELECT duration_minutes, price FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = serviceResult.rows[0];
    const minutes = service.duration_minutes;
    const endMinutes = parseInt(start_time.split(':')[1]) + minutes;
    const endHour = parseInt(start_time.split(':')[0]) + Math.floor(endMinutes / 60);
    const end_time = `${String(endHour).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Create booking
    await pool.query(
      'INSERT INTO bookings (id, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, 'pending']
    );

    // Log customer
    await pool.query(
      'INSERT INTO customers (id, business_id, name, email, phone, total_bookings) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (business_id, email) DO UPDATE SET total_bookings = total_bookings + 1',
      [uuidv4(), business_id, customer_name, customer_email, customer_phone]
    );

    res.status(201).json({ 
      message: 'Booking created',
      booking_id: id,
      amount: service.price
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get bookings
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query(
      'SELECT b.*, s.name as service_name, s.price FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.business_id = $1 ORDER BY b.booking_date DESC',
      [business_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      [status, id]
    );

    res.json({ message: 'Booking updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
