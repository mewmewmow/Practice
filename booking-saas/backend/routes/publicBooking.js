const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const validationService = require('../utils/validationService');
const { NotFoundError, ValidationError } = require('../utils/errors');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get public booking page for a business
router.get('/:business_slug', async (req, res) => {
  try {
    const { business_slug } = req.params;

    const businessResult = await pool.query(
      'SELECT id, name, email FROM businesses WHERE slug = $1 OR email LIKE $2',
      [business_slug, `%${business_slug}%`]
    );

    if (businessResult.rows.length === 0) {
      throw new NotFoundError('Business');
    }

    const business = businessResult.rows[0];

    // Get services
    const servicesResult = await pool.query(
      'SELECT id, name, duration_minutes, price, description FROM services WHERE business_id = $1 AND active = true',
      [business.id]
    );

    // Get availability
    const availabilityResult = await pool.query(
      'SELECT * FROM availability WHERE business_id = $1 ORDER BY day_of_week',
      [business.id]
    );

    // Get upcoming available dates (next 30 days)
    const bookingCounts = await pool.query(`
      SELECT DATE(booking_date) as date, 
             day_of_week(booking_date) as dow,
             COUNT(*) as count
      FROM bookings
      WHERE business_id = $1 AND status = 'confirmed' AND booking_date > NOW()
      GROUP BY DATE(booking_date)
    `, [business.id]);

    res.json({
      business: {
        id: business.id,
        name: business.name
      },
      services: servicesResult.rows,
      availability: availabilityResult.rows,
      bookings: bookingCounts.rows
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Create public booking (no auth required)
router.post('/:business_slug/book', async (req, res) => {
  try {
    const { business_slug } = req.params;
    const { service_id, customer_name, customer_email, customer_phone, booking_date, start_time } = req.body;

    // Validate input
    const validationResult = validationService.validateBookingData({
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      start_time
    });

    if (!validationResult.valid) {
      throw new ValidationError(validationResult.error);
    }

    // Get business
    const businessResult = await pool.query(
      'SELECT id, name, email FROM businesses WHERE slug = $1',
      [business_slug]
    );

    if (businessResult.rows.length === 0) {
      throw new NotFoundError('Business');
    }

    const business = businessResult.rows[0];

    // Get service
    const serviceResult = await pool.query(
      'SELECT duration_minutes, price FROM services WHERE id = $1 AND business_id = $2',
      [service_id, business.id]
    );

    if (serviceResult.rows.length === 0) {
      throw new NotFoundError('Service');
    }

    const service = serviceResult.rows[0];

    // Calculate end time
    const [hours, minutes] = start_time.split(':').map(Number);
    const endHours = Math.floor((minutes + service.duration_minutes) / 60);
    const endMinutes = (minutes + service.duration_minutes) % 60;
    const end_time = `${String(hours + endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    // Create booking
    const bookingId = uuidv4();
    await pool.query(
      `INSERT INTO bookings 
       (id, business_id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [bookingId, business.id, service_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, 'confirmed']
    );

    // Send confirmation emails
    await emailService.sendBookingConfirmation(customer_email, {
      service_name: (await pool.query('SELECT name FROM services WHERE id = $1', [service_id])).rows[0].name,
      booking_date,
      start_time,
      end_time,
      price: service.price,
      business_name: business.name
    });

    await emailService.transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: business.email,
      subject: `New Booking: ${customer_name} - ${booking_date}`,
      html: `<p>New booking from ${customer_name} (${customer_email})</p>`
    });

    res.status(201).json({ 
      message: 'Booking confirmed! Check your email for details.',
      booking_id: bookingId
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Get available time slots for a date
router.get('/:business_slug/slots/:date', async (req, res) => {
  try {
    const { business_slug, date } = req.params;

    const businessResult = await pool.query(
      'SELECT id FROM businesses WHERE slug = $1',
      [business_slug]
    );

    if (businessResult.rows.length === 0) {
      throw new NotFoundError('Business');
    }

    const businessId = businessResult.rows[0].id;

    // Get day of week
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    // Get availability for this day
    const availabilityResult = await pool.query(
      'SELECT start_time, end_time FROM availability WHERE business_id = $1 AND day_of_week = $2',
      [businessId, dayOfWeek]
    );

    if (availabilityResult.rows.length === 0) {
      return res.json({ slots: [] });
    }

    const availability = availabilityResult.rows[0];

    // Get booked slots
    const bookedResult = await pool.query(
      'SELECT start_time, end_time FROM bookings WHERE business_id = $1 AND booking_date = $2 AND status = \'confirmed\'',
      [businessId, date]
    );

    // Generate available slots (15-min intervals)
    const slots = generateAvailableSlots(
      availability.start_time,
      availability.end_time,
      bookedResult.rows
    );

    res.json({ slots });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

function generateAvailableSlots(startTime, endTime, bookedSlots) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    // Check if slot is booked
    const isBooked = bookedSlots.some(slot =>
      slot.start_time === slotTime
    );

    if (!isBooked) {
      slots.push(slotTime);
    }

    currentMin += 15;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

module.exports = router;
