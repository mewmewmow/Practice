require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');
const { warmCache } = require('./services/cacheService');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/smartbook'
});

// Check database connection
pool.on('error', (err) => console.error('Unexpected error on idle client', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/services', require('./routes/services.js'));
app.use('/api/bookings', require('./routes/bookings.js'));
app.use('/api/customers', require('./routes/customers.js'));
app.use('/api/availability', require('./routes/availability.js'));
app.use('/api/payments', require('./routes/payments.js'));
app.use('/api/analytics', require('./routes/analytics.js'));

// New advanced feature routes
app.use('/api/public-booking', require('./routes/publicBooking.js'));
app.use('/api/recurring', require('./routes/recurringBookings.js'));
app.use('/api/management', require('./routes/cancellationAndReschedule.js'));
app.use('/api/team', require('./routes/teamMembers.js'));
app.use('/api/invoices', require('./routes/invoicing.js'));
app.use('/api/integrations', require('./routes/zapierIntegration.js'));
app.use('/api/advanced-analytics', require('./routes/advancedAnalytics.js'));
app.use('/api/onboarding', require('./routes/onboarding.js'));
app.use('/api/calendar', require('./routes/googleCalendar.js'));
app.use('/api/2fa', require('./routes/twoFactorAuth.js'));
app.use('/api/pricing', require('./routes/pricing.js'));

// Warm up cache on startup (non-blocking)
warmCache().catch(err => console.error('Cache warming error:', err.message));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SmartBook Backend running on port ${PORT}`);
});
