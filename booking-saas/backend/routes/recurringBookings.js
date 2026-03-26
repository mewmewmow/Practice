const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create recurring booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, recurrence_type, recurrence_count } = req.body;

    // Validate
    if (!['weekly', 'biweekly', 'monthly'].includes(recurrence_type)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    if (recurrence_count < 1 || recurrence_count > 52) {
      return res.status(400).json({ error: 'Recurrence count must be 1-52' });
    }

    // Get service details
    const serviceResult = await pool.query(
      'SELECT duration_minutes, price FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = serviceResult.rows[0];

    // Calculate end time
    const [hours, minutes] = start_time.split(':').map(Number);
    const endHours = Math.floor((minutes + service.duration_minutes) / 60);
    const endMinutes = (minutes + service.duration_minutes) % 60;
    const end_time = `${String(hours + endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    // Generate recurring bookings
    const seriesId = uuidv4();
    let currentDate = new Date(booking_date);
    const bookingIds = [];

    for (let i = 0; i < recurrence_count; i++) {
      const bookingId = uuidv4();
      const dateStr = currentDate.toISOString().split('T')[0];

      await pool.query(
        `INSERT INTO bookings 
         (id, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status, series_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [bookingId, business_id, service_id, customer_name, customer_email, customer_phone, dateStr, start_time, end_time, 'confirmed', seriesId]
      );

      bookingIds.push(bookingId);

      // Add recurrence interval
      if (recurrence_type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (recurrence_type === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (recurrence_type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Send confirmation
    await emailService.sendBookingConfirmation(customer_email, {
      service_name: 'Recurring booking',
      booking_date: `${booking_date} (+ ${recurrence_count - 1} more)`,
      start_time,
      end_time,
      price: service.price * recurrence_count,
      business_name: business_id
    });

    res.status(201).json({
      message: `${recurrence_count} recurring bookings created`,
      series_id: seriesId,
      booking_ids: bookingIds
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create recurring bookings' });
  }
});

// Get recurring series
router.get('/series/:series_id', authenticateToken, async (req, res) => {
  try {
    const { series_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM bookings WHERE series_id = $1 ORDER BY booking_date',
      [series_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Cancel entire series
router.delete('/series/:series_id', authenticateToken, async (req, res) => {
  try {
    const { series_id } = req.params;

    // Get all bookings in series
    const bookingsResult = await pool.query(
      'SELECT id, customer_email, customer_phone, service_name FROM bookings WHERE series_id = $1',
      [series_id]
    );

    // Cancel each booking
    for (const booking of bookingsResult.rows) {
      await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        ['cancelled', booking.id]
      );

      // Send cancellation notice
      await emailService.sendCancellationEmail(booking.customer_email, {
        service_name: booking.service_name,
        business_name: 'Your business'
      });
    }

    res.json({ message: `Cancelled ${bookingsResult.rows.length} bookings` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel series' });
  }
});

module.exports = router;
