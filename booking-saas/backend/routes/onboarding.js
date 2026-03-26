const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get onboarding progress
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const businessResult = await pool.query(
      'SELECT onboarding_step, onboarding_completed FROM businesses WHERE id = $1',
      [business_id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = businessResult.rows[0];

    // Get progress data
    const servicesCount = await pool.query(
      'SELECT COUNT(*) FROM services WHERE business_id = $1',
      [business_id]
    );

    const availabilityCount = await pool.query(
      'SELECT COUNT(*) FROM availability WHERE business_id = $1',
      [business_id]
    );

    const bookingsCount = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE business_id = $1',
      [business_id]
    );

    const teamCount = await pool.query(
      'SELECT COUNT(*) FROM team_members WHERE business_id = $1',
      [business_id]
    );

    res.json({
      current_step: business.onboarding_step || 1,
      completed: business.onboarding_completed,
      progress: {
        services: parseInt(servicesCount.rows[0].count) > 0,
        availability: parseInt(availabilityCount.rows[0].count) > 0,
        first_booking: parseInt(bookingsCount.rows[0].count) > 0,
        team_member: parseInt(teamCount.rows[0].count) > 1, // Owner + at least 1 more
        profile_complete: business.onboarding_step >= 5
      },
      steps: [
        {
          step: 1,
          title: 'Welcome',
          description: 'Get started with your booking platform',
          action: 'next'
        },
        {
          step: 2,
          title: 'Create Services',
          description: 'Add your services and pricing',
          action: 'create_service',
          required: true
        },
        {
          step: 3,
          title: 'Set Hours',
          description: 'Configure your availability',
          action: 'set_availability',
          required: true
        },
        {
          step: 4,
          title: 'Connect Payment',
          description: 'Accept payments via Stripe',
          action: 'connect_stripe',
          required: false
        },
        {
          step: 5,
          title: 'Share Your Link',
          description: 'Get your public booking link',
          action: 'get_booking_link',
          required: true
        },
        {
          step: 6,
          title: 'Invite Team',
          description: 'Add team members to manage bookings',
          action: 'invite_team',
          required: false
        },
        {
          step: 7,
          title: 'First Booking!',
          description: 'Receive your first customer booking',
          action: 'await_booking',
          required: false
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch onboarding progress' });
  }
});

// Update onboarding step
router.patch('/:business_id/step', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const { step } = req.body;

    if (step < 1 || step > 7) {
      return res.status(400).json({ error: 'Invalid step' });
    }

    await pool.query(
      'UPDATE businesses SET onboarding_step = $1 WHERE id = $2',
      [step, business_id]
    );

    res.json({ message: `Onboarding step updated to ${step}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update onboarding step' });
  }
});

// Mark onboarding as complete
router.post('/:business_id/complete', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    await pool.query(
      'UPDATE businesses SET onboarding_completed = true, onboarding_step = 7 WHERE id = $1',
      [business_id]
    );

    // Send completion celebration email
    const businessResult = await pool.query(
      'SELECT email, name FROM businesses WHERE id = $1',
      [business_id]
    );

    if (businessResult.rows.length > 0) {
      const business = businessResult.rows[0];

      // Send email (optional - would use emailService)
      const emailService = require('../services/emailService');

      await emailService.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: business.email,
        subject: '🎉 Welcome to SmartBook Booking!',
        html: `
          <h2>You're All Set!</h2>
          <p>Congratulations ${business.name}! Your booking platform is ready.</p>
          <p>Share your public booking link with customers to start receiving bookings.</p>
          <p><a href="${process.env.APP_URL}/dashboard">View Your Dashboard</a></p>
        `
      });
    }

    res.json({ 
      message: 'Onboarding completed!',
      next_step: 'Share your public booking link with customers'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Get onboarding tips
router.get('/:business_id/tips', async (req, res) => {
  try {
    const tips = [
      {
        title: 'Upload a header image',
        description: 'Add a professional image to your booking page',
        priority: 'high'
      },
      {
        title: 'Write service descriptions',
        description: 'Help customers understand what you offer',
        priority: 'high'
      },
      {
        title: 'Set up cancellation policy',
        description: 'Define your cancellation rules',
        priority: 'medium'
      },
      {
        title: 'Add team members',
        description: 'Collaborate with your team',
        priority: 'medium'
      },
      {
        title: 'Configure email reminders',
        description: 'Reduce no-shows with automated reminders',
        priority: 'high'
      },
      {
        title: 'Create a promo code',
        description: 'Offer discounts to new customers',
        priority: 'low'
      }
    ];

    res.json(tips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

module.exports = router;
