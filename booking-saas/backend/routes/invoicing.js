const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Generate invoice for booking
router.get('/:booking_id/pdf', async (req, res) => {
  try {
    const { booking_id } = req.params;

    const bookingResult = await pool.query(
      'SELECT b.*, s.name as service_name, s.price, biz.name as business_name, biz.email as business_email FROM bookings b JOIN services s ON b.service_id = s.id JOIN businesses biz ON b.business_id = biz.id WHERE b.id = $1',
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking_id}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text(booking.business_name, 50, 50);
    doc.fontSize(12).text(booking.business_email);

    // Invoice title
    doc.fontSize(16).text('INVOICE', 50, 120);
    doc.fontSize(10).text(`Invoice #: ${booking_id.slice(0, 8).toUpperCase()}`);
    doc.text(`Date: ${new Date(booking.booking_date).toLocaleDateString()}`);

    // Customer details
    doc.text(`Customer: ${booking.customer_name}`, 50, 180);
    doc.text(`Email: ${booking.customer_email}`);
    doc.text(`Phone: ${booking.customer_phone}`);

    // Service details
    doc.text(`Service: ${booking.service_name}`, 50, 240);
    doc.text(`Date & Time: ${booking.booking_date} at ${booking.start_time}`);
    doc.text(`Duration: ${booking.end_time}`);

    // Amount
    const tax = (booking.price * 0.1).toFixed(2);
    const total = (booking.price + parseFloat(tax)).toFixed(2);

    doc.moveTo(50, 320).lineTo(500, 320).stroke();

    doc.fontSize(12).text('Subtotal:', 250, 340);
    doc.text(`$${booking.price.toFixed(2)}`, 400, 340);

    doc.text('Tax (10%):', 250, 365);
    doc.text(`$${tax}`, 400, 365);

    doc.fontSize(14).text('Total:', 250, 400);
    doc.text(`$${total}`, 400, 400);

    // Footer
    doc.fontSize(10).text('Thank you for your business!', 50, 550);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Create invoice record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, business_id, amount, due_date } = req.body;

    const invoiceId = uuidv4();

    await pool.query(
      `INSERT INTO invoices (id, booking_id, business_id, amount, due_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [invoiceId, booking_id, business_id, amount, due_date, 'unpaid']
    );

    res.status(201).json({
      message: 'Invoice created',
      invoice_id: invoiceId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get invoices for business
router.get('/business/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const result = await pool.query(
      'SELECT id, booking_id, amount, created_at, due_date, status FROM invoices WHERE business_id = $1 ORDER BY created_at DESC',
      [business_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Mark invoice as paid
router.patch('/:invoice_id/paid', authenticateToken, async (req, res) => {
  try {
    const { invoice_id } = req.params;

    await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2',
      ['paid', invoice_id]
    );

    res.json({ message: 'Invoice marked as paid' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Send invoice email
router.post('/:invoice_id/send', authenticateToken, async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const invoiceResult = await pool.query(
      'SELECT i.*, b.customer_email FROM invoices i JOIN bookings b ON i.booking_id = b.id WHERE i.id = $1',
      [invoice_id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Send email with PDF
    await emailService.sendInvoice(invoice.customer_email, {
      invoice_id,
      amount: invoice.amount,
      due_date: invoice.due_date,
      business_name: 'Your business'
    });

    res.json({ message: 'Invoice sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

module.exports = router;
