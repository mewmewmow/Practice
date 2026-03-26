const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Cancel booking
router.post('/:booking_id/cancel', async (req, res) => {
  try {
    const { booking_id } = req.params;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Update booking status
    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', booking_id]
    );

    // Send cancellation email
    const serviceResult = await pool.query(
      'SELECT name FROM services WHERE id = $1',
      [booking.service_id]
    );

    await emailService.sendCancellationEmail(booking.customer_email, {
      service_name: serviceResult.rows[0]?.name || 'Service',
      business_name: 'Your business'
    });

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Reschedule booking
router.post('/:booking_id/reschedule', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { new_date, new_time } = req.body;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Get service to calculate end time
    const serviceResult = await pool.query(
      'SELECT duration_minutes FROM services WHERE id = $1',
      [booking.service_id]
    );

    const service = serviceResult.rows[0];
    const [hours, minutes] = new_time.split(':').map(Number);
    const endHours = Math.floor((minutes + service.duration_minutes) / 60);
    const endMinutes = (minutes + service.duration_minutes) % 60;
    const new_end_time = `${String(hours + endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    // Update booking
    await pool.query(
      'UPDATE bookings SET booking_date = $1, start_time = $2, end_time = $3 WHERE id = $4',
      [new_date, new_time, new_end_time, booking_id]
    );

    // Send rescheduling confirmation
    await emailService.sendBookingConfirmation(booking.customer_email, {
      service_name: (await pool.query('SELECT name FROM services WHERE id = $1', [booking.service_id])).rows[0].name,
      booking_date: new_date,
      start_time: new_time,
      end_time: new_end_time,
      price: (await pool.query('SELECT price FROM services WHERE id = $1', [booking.service_id])).rows[0].price,
      business_name: 'Your business'
    });

    res.json({ message: 'Booking rescheduled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// Get reschedule/cancel token for public link
router.post('/:booking_id/generate-token', async (req, res) => {
  try {
    const { booking_id } = req.params;

    const token = uuidv4();

    await pool.query(
      'UPDATE bookings SET management_token = $1 WHERE id = $2',
      [token, booking_id]
    );

    res.json({
      token,
      reschedule_link: `${process.env.APP_URL}/reschedule/${token}`,
      cancel_link: `${process.env.APP_URL}/cancel/${token}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Reschedule via public link
router.post('/token/:token/reschedule', async (req, res) => {
  try {
    const { token } = req.params;
    const { new_date, new_time } = req.body;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE management_token = $1',
      [token]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const booking = bookingResult.rows[0];

    // Update booking
    await pool.query(
      'UPDATE bookings SET booking_date = $1, start_time = $2 WHERE id = $3',
      [new_date, new_time, booking.id]
    );

    await emailService.sendBookingConfirmation(booking.customer_email, {
      service_name: 'Your rescheduled booking',
      booking_date: new_date,
      start_time: new_time,
      price: 0,
      business_name: 'Your business'
    });

    res.json({ message: 'Booking rescheduled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reschedule' });
  }
});

// Cancel via public link
router.post('/token/:token/cancel', async (req, res) => {
  try {
    const { token } = req.params;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE management_token = $1',
      [token]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const booking = bookingResult.rows[0];

    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', booking.id]
    );

    await emailService.sendCancellationEmail(booking.customer_email, {
      service_name: 'Your booking',
      business_name: 'Your business'
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel' });
  }
});

module.exports = router;
