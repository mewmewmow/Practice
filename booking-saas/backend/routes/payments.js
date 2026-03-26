const express = require('express');
const { Pool } = require('pg');

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

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { booking_id, amount, business_email } = req.body;

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { booking_id }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      payment_id: paymentIntent.id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm', async (req, res) => {
  try {
    const { booking_id, payment_id } = req.body;

    await pool.query(
      'UPDATE bookings SET payment_status = $1, stripe_payment_id = $2, status = $3 WHERE id = $4',
      ['completed', payment_id, 'confirmed', booking_id]
    );

    res.json({ message: 'Payment confirmed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
