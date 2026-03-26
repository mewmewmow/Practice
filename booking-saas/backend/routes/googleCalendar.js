const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { google } = require('googleapis');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// OAuth2 client setup (lazy initialized to handle missing credentials)
let oauth2Client = null;
let calendar = null;

function initializeGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return false;
  }
  
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }
  
  return true;
}

// Get authorization URL
router.get('/google/auth-url', (req, res) => {
  try {
    if (!initializeGoogleAuth()) {
      return res.status(503).json({ error: 'Google Calendar integration not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.' });
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });

    res.json({ auth_url: authUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle Google OAuth callback
router.post('/google/callback', authenticateToken, async (req, res) => {
  try {
    if (!initializeGoogleAuth()) {
      return res.status(503).json({ error: 'Google Calendar integration not configured' });
    }

    const { code, business_id } = req.body;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in database
    await pool.query(
      `INSERT INTO integrations (business_id, integration_type, status, auth_token, config) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (business_id, integration_type) DO UPDATE SET auth_token = $4, status = $3`,
      [business_id, 'google_calendar', 'active', JSON.stringify(tokens), JSON.stringify({ calendarId: 'primary' })]
    );

    res.json({ message: 'Google Calendar connected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// Sync booking to Google Calendar
router.post('/google/sync-booking/:booking_id', authenticateToken, async (req, res) => {
  try {
    if (!initializeGoogleAuth()) {
      return res.status(503).json({ error: 'Google Calendar integration not configured' });
    }

    const { booking_id } = req.params;

    const bookingResult = await pool.query(
      `SELECT b.*, s.name as service_name, biz.id as business_id 
       FROM bookings b 
       JOIN services s ON b.service_id = s.id
       JOIN businesses biz ON b.business_id = biz.id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Get stored Google credentials
    const integrationResult = await pool.query(
      'SELECT auth_token, config FROM integrations WHERE business_id = $1 AND integration_type = $2',
      [booking.business_id, 'google_calendar']
    );

    if (integrationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const integration = integrationResult.rows[0];
    const tokens = JSON.parse(integration.auth_token);
    const config = JSON.parse(integration.config);

    oauth2Client.setCredentials(tokens);

    // Create event
    const event = {
      summary: `Booking: ${booking.service_name}`,
      description: `Customer: ${booking.customer_name}\nEmail: ${booking.customer_email}\nPhone: ${booking.customer_phone}`,
      start: {
        dateTime: new Date(`${booking.booking_date}T${booking.start_time}`),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(`${booking.booking_date}T${booking.end_time}`),
        timeZone: 'UTC'
      },
      attendees: [
        { email: booking.customer_email, responseStatus: 'needsAction' }
      ]
    };

    const response = await calendar.events.insert({
      calendarId: config.calendarId,
      resource: event
    });

    // Store event ID
    await pool.query(
      'UPDATE bookings SET google_calendar_event_id = $1 WHERE id = $2',
      [response.data.id, booking_id]
    );

    res.json({ 
      message: 'Booking synced to Google Calendar',
      event_id: response.data.id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync to Google Calendar' });
  }
});

// Get calendar availability
router.get('/google/availability/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;
    const { date } = req.query;

    const integrationResult = await pool.query(
      'SELECT auth_token, config FROM integrations WHERE business_id = $1 AND integration_type = $2',
      [business_id, 'google_calendar']
    );

    if (integrationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const integration = integrationResult.rows[0];
    const tokens = JSON.parse(integration.auth_token);
    const config = JSON.parse(integration.config);

    oauth2Client.setCredentials(tokens);

    // Get events for date
    const events = await calendar.events.list({
      calendarId: config.calendarId,
      timeMin: new Date(`${date}T00:00:00`).toISOString(),
      timeMax: new Date(`${date}T23:59:59`).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({ booked_slots: events.data.items || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// Disconnect Google Calendar
router.post('/google/disconnect/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    await pool.query(
      'DELETE FROM integrations WHERE business_id = $1 AND integration_type = $2',
      [business_id, 'google_calendar']
    );

    res.json({ message: 'Google Calendar disconnected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
