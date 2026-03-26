const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get advanced analytics
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const { startDate, endDate } = req.query;

    // Revenue by service
    const revenueByService = await pool.query(
      `SELECT s.name, COUNT(b.id) as bookings, SUM(s.price) as revenue
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.business_id = $1 AND b.status = 'confirmed' 
       ${startDate ? 'AND b.booking_date >= $2' : ''} 
       ${endDate ? 'AND b.booking_date <= $3' : ''}
       GROUP BY s.id, s.name
       ORDER BY revenue DESC`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    // Customer acquisition
    const customerAcquisition = await pool.query(
      `SELECT DATE_TRUNC('week', b.created_at)::DATE as week, COUNT(DISTINCT b.customer_email) as new_customers
       FROM bookings b
       WHERE b.business_id = $1 AND b.status = 'confirmed'
       ${startDate ? 'AND b.created_at >= $2' : ''} 
       ${endDate ? 'AND b.created_at <= $3' : ''}
       GROUP BY DATE_TRUNC('week', b.created_at)
       ORDER BY week DESC
       LIMIT 12`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    // Booking trends
    const bookingTrends = await pool.query(
      `SELECT DATE_TRUNC('day', b.booking_date)::DATE as date, COUNT(*) as bookings, SUM(s.price) as revenue
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.business_id = $1 AND b.status = 'confirmed'
       ${startDate ? 'AND b.booking_date >= $2' : ''} 
       ${endDate ? 'AND b.booking_date <= $3' : ''}
       GROUP BY DATE_TRUNC('day', b.booking_date)
       ORDER BY date DESC
       LIMIT 30`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    // Cancellation rate
    const cancellationRate = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::FLOAT / COUNT(*) * 100 as cancel_rate
       FROM bookings b
       WHERE b.business_id = $1
       ${startDate ? 'AND b.created_at >= $2' : ''} 
       ${endDate ? 'AND b.created_at <= $3' : ''}`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    // Average booking value
    const avgBookingValue = await pool.query(
      `SELECT AVG(s.price) as avg_price, MIN(s.price) as min_price, MAX(s.price) as max_price
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.business_id = $1 AND b.status = 'confirmed'
       ${startDate ? 'AND b.booking_date >= $2' : ''} 
       ${endDate ? 'AND b.booking_date <= $3' : ''}`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    // Repeat customer rate
    const repeatCustomers = await pool.query(
      `SELECT 
        COUNT(DISTINCT customer_email) as total_unique_customers,
        COUNT(DISTINCT CASE WHEN booking_count > 1 THEN customer_email END) as repeat_customers
       FROM (
         SELECT customer_email, COUNT(*) as booking_count
         FROM bookings
         WHERE business_id = $1 AND status = 'confirmed'
         ${startDate ? 'AND booking_date >= $2' : ''} 
         ${endDate ? 'AND booking_date <= $3' : ''}
         GROUP BY customer_email
       ) subquery`,
      startDate && endDate ? [business_id, startDate, endDate] : [business_id]
    );

    res.json({
      revenueByService: revenueByService.rows,
      customerAcquisition: customerAcquisition.rows,
      bookingTrends: bookingTrends.rows,
      cancellationRate: cancellationRate.rows[0],
      averageBookingValue: avgBookingValue.rows[0],
      repeatCustomerMetrics: repeatCustomers.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get monthly revenue report
router.get('/:business_id/monthly-report', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const result = await pool.query(
      `SELECT DATE_TRUNC('month', b.booking_date)::DATE as month, 
              COUNT(*) as booking_count, 
              SUM(s.price) as revenue,
              AVG(s.price) as avg_price
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.business_id = $1 AND b.status = 'confirmed'
       GROUP BY DATE_TRUNC('month', b.booking_date)
       ORDER BY month DESC
       LIMIT 12`,
      [business_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});

// Get customer cohort analysis
router.get('/:business_id/cohort-analysis', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', MIN(b.created_at))::DATE as cohort_month,
        DATE_PART('month', AGE(MAX(b.created_at), MIN(b.created_at)))::INT as months_active,
        COUNT(DISTINCT b.customer_email) as customers,
        COUNT(*) as total_bookings,
        SUM(s.price) as revenue
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.business_id = $1 AND b.status = 'confirmed'
       GROUP BY DATE_TRUNC('month', MIN(b.created_at))
       ORDER BY cohort_month DESC`,
      [business_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cohort analysis' });
  }
});

module.exports = router;
