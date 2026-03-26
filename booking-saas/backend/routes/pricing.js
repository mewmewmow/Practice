const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

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

// Define pricing tiers
const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    bookings_limit: 50,
    team_members: 1,
    features: ['basic', 'email_reminders']
  },
  starter: {
    name: 'Starter',
    price: 2900, // $29/month in cents
    bookings_limit: 500,
    team_members: 3,
    features: ['basic', 'email_reminders', 'sms', 'analytics', 'public_link'],
    stripe_price_id: 'price_starter_monthly'
  },
  professional: {
    name: 'Professional',
    price: 9900, // $99/month
    bookings_limit: 5000,
    team_members: 10,
    features: ['all'],
    stripe_price_id: 'price_professional_monthly'
  }
};

// Get pricing tiers
router.get('/tiers', (req, res) => {
  res.json(PRICING_TIERS);
});

// Get business current tier
router.get('/:business_id/current', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const result = await pool.query(
      'SELECT pricing_tier, subscription_status, subscription_id FROM businesses WHERE id = $1',
      [business_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = result.rows[0];
    const tier = PRICING_TIERS[business.pricing_tier] || PRICING_TIERS.free;

    res.json({
      current_tier: business.pricing_tier,
      tier_details: tier,
      subscription_status: business.subscription_status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tier' });
  }
});

// Upgrade to paid tier
router.post('/:business_id/upgrade', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const { tier, payment_method_id } = req.body;

    if (!PRICING_TIERS[tier] || tier === 'free') {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const tierInfo = PRICING_TIERS[tier];

    // Get business
    const businessResult = await pool.query(
      'SELECT email, name FROM businesses WHERE id = $1',
      [business_id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = businessResult.rows[0];

    // Create Stripe customer
    const customer = await getStripe().customers.create({
      email: business.email,
      name: business.name,
      metadata: { business_id }
    });

    // Create subscription
    const subscription = await getStripe().subscriptions.create({
      customer: customer.id,
      items: [{ price: tierInfo.stripe_price_id }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on'
      }
    });

    // Update business
    await pool.query(
      `UPDATE businesses 
       SET pricing_tier = $1, subscription_id = $2, subscription_status = $3, stripe_customer_id = $4
       WHERE id = $5`,
      [tier, subscription.id, 'active', customer.id, business_id]
    );

    res.json({
      message: 'Upgrade successful',
      subscription_id: subscription.id,
      next_billing_date: new Date(subscription.current_period_end * 1000)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

// Downgrade to free tier
router.post('/:business_id/downgrade', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    // Get subscription ID
    const businessResult = await pool.query(
      'SELECT subscription_id FROM businesses WHERE id = $1 AND pricing_tier != $2',
      [business_id, 'free']
    );

    if (businessResult.rows.length === 0) {
      return res.status(400).json({ error: 'Not on paid tier' });
    }

    const subscriptionId = businessResult.rows[0].subscription_id;

    // Cancel subscription
    await getStripe().subscriptions.del(subscriptionId);

    // Update business
    await pool.query(
      'UPDATE businesses SET pricing_tier = $1, subscription_status = $2 WHERE id = $3',
      ['free', 'cancelled', business_id]
    );

    res.json({ message: 'Downgraded to free tier' });
  } catch (err) {
    res.status(500).json({ error: 'Downgrade failed' });
  }
});

// Get usage stats
router.get('/:business_id/usage', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const bookingsResult = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE business_id = $1 AND created_at > NOW() - INTERVAL \'1 month\'',
      [business_id]
    );

    const teamResult = await pool.query(
      'SELECT COUNT(*) FROM team_members WHERE business_id = $1',
      [business_id]
    );

    const businessResult = await pool.query(
      'SELECT pricing_tier FROM businesses WHERE id = $1',
      [business_id]
    );

    const tier = PRICING_TIERS[businessResult.rows[0].pricing_tier];

    res.json({
      bookings_used: parseInt(bookingsResult.rows[0].count),
      bookings_limit: tier.bookings_limit,
      team_members_used: parseInt(teamResult.rows[0].count),
      team_members_limit: tier.team_members,
      usage_percent: {
        bookings: (parseInt(bookingsResult.rows[0].count) / tier.bookings_limit) * 100,
        team: (parseInt(teamResult.rows[0].count) / tier.team_members) * 100
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

module.exports = router;
