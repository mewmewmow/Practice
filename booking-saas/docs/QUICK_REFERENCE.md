# SmartBook Developer Quick Reference

## 🚀 Quick Start

### Installation
```bash
cd booking-saas/backend
npm install
```

### Running Locally
```bash
# Start development server
npm run dev

# Run database migration
npm run db:migrate
npm run db:migrate-advanced

# Warm up cache
npm run cache:warm

# Run tests
npm test
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials and run:
npm run dev
```

---

## 📡 API Endpoints Reference

### Public Booking (No Auth Required)
```
GET    /api/public-booking/:business_slug
POST   /api/public-booking/:business_slug/book
GET    /api/public-booking/:business_slug/slots/:date
```

### Authentication Required (Add: `Authorization: Bearer <token>`)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/recurring/
GET    /api/recurring/series/:series_id
DELETE /api/recurring/series/:series_id

POST   /api/management/:booking_id/cancel
POST   /api/management/:booking_id/reschedule
POST   /api/management/:booking_id/generate-token
POST   /api/management/token/:token/reschedule
POST   /api/management/token/:token/cancel

POST   /api/team/
GET    /api/team/:business_id
PATCH  /api/team/:member_id
DELETE /api/team/:member_id
POST   /api/team/invite/:token/accept
GET    /api/team/:member_id/permissions

GET    /api/invoices/:booking_id/pdf
POST   /api/invoices/
GET    /api/invoices/business/:business_id
PATCH  /api/invoices/:invoice_id/paid
POST   /api/invoices/:invoice_id/send

GET    /api/advanced-analytics/:business_id
GET    /api/advanced-analytics/:business_id/monthly-report
GET    /api/advanced-analytics/:business_id/cohort-analysis

GET    /api/onboarding/:business_id
PATCH  /api/onboarding/:business_id/step
POST   /api/onboarding/:business_id/complete
GET    /api/onboarding/:business_id/tips

GET    /api/calendar/google/auth-url
POST   /api/calendar/google/callback
POST   /api/calendar/google/sync-booking/:booking_id
GET    /api/calendar/google/availability/:business_id
POST   /api/calendar/google/disconnect/:business_id

POST   /api/2fa/generate
POST   /api/2fa/enable
POST   /api/2fa/verify
POST   /api/2fa/disable
GET    /api/2fa/:user_id/status

GET    /api/pricing/tiers
GET    /api/pricing/:business_id/current
POST   /api/pricing/:business_id/upgrade
POST   /api/pricing/:business_id/downgrade
GET    /api/pricing/:business_id/usage

POST   /api/integrations/zapier/new-booking
POST   /api/integrations/zapier/new-customer
POST   /api/integrations/zapier/revenue-milestone
POST   /api/integrations/zapier/create-booking
GET    /api/integrations/zapier/test
```

---

## 📁 Project Structure

```
booking-saas/
├── backend/
│   ├── routes/
│   │   ├── auth.js                    (Login/Register)
│   │   ├── bookings.js                (Core bookings)
│   │   ├── services.js                (Business services)
│   │   ├── customers.js               (Customer management)
│   │   ├── availability.js            (Work hours)
│   │   ├── payments.js                (Stripe)
│   │   ├── analytics.js               (Basic analytics)
│   │   ├── publicBooking.js           ⭐ NEW (Public link)
│   │   ├── recurringBookings.js       ⭐ NEW (Recurring)
│   │   ├── cancellationAndReschedule.js ⭐ NEW (Management)
│   │   ├── teamMembers.js             ⭐ NEW (Team)
│   │   ├── invoicing.js               ⭐ NEW (Invoices)
│   │   ├── advancedAnalytics.js       ⭐ NEW (Analytics)
│   │   ├── onboarding.js              ⭐ NEW (Onboarding)
│   │   ├── googleCalendar.js          ⭐ NEW (Google)
│   │   ├── twoFactorAuth.js           ⭐ NEW (2FA)
│   │   ├── pricing.js                 ⭐ NEW (Pricing)
│   │   └── zapierIntegration.js       ⭐ NEW (Zapier)
│   ├── services/
│   │   ├── emailService.js            ⭐ NEW (Email)
│   │   ├── smsService.js              ⭐ NEW (SMS)
│   │   ├── notificationService.js     ⭐ NEW (Scheduling)
│   │   └── cacheService.js            ⭐ NEW (Redis)
│   ├── middleware/
│   │   ├── auth.js                    (JWT)
│   │   └── rateLimiter.js             ⭐ NEW (Rate limit)
│   ├── utils/
│   │   ├── validationService.js       ⭐ NEW (Validation)
│   │   └── errors.js                  ⭐ NEW (Error handling)
│   ├── scripts/
│   │   ├── migrate.js                 (Core schema)
│   │   ├── migrate-advanced.js        ⭐ NEW (Advanced schema)
│   │   └── migrate-advanced.sql       ⭐ NEW (SQL migrations)
│   ├── server.js                      (Express app)
│   └── package.json                   (Updated)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── BookingPage.js
│   │   │   └── SettingsPage.js
│   │   └── App.js
│   └── package.json
├── admin-dashboard/
│   ├── src/
│   │   └── App.js
│   └── package.json
└── docs/
    ├── README.md
    ├── API.md
    ├── DEPLOYMENT.md
    ├── BUSINESS_MODEL.md
    ├── MARKETING.md
    ├── PROPOSALS.md
    ├── IMPROVEMENTS.md
    ├── IMPLEMENTATION_STATUS.md      ⭐ NEW
    └── TESTING_AND_DEPLOYMENT.md     ⭐ NEW
```

**⭐ = New files created in this update**

---

## 🔧 Common Workflows

### Testing a New Feature Endpoint

1. **Create route**:
```javascript
// routes/myfeature.js
const express = require('express');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    // Your code
    res.json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

2. **Register in server.js**:
```javascript
app.use('/api/myfeature', require('./routes/myfeature.js'));
```

3. **Test with curl**:
```bash
curl -X POST http://localhost:3000/api/myfeature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Integrating a New Service

1. **Create service file**:
```javascript
// services/myService.js
module.exports = {
  async doSomething(data) {
    // Implementation
    return result;
  }
};
```

2. **Use in route**:
```javascript
const myService = require('../services/myService');

router.post('/', authenticateToken, async (req, res) => {
  const result = await myService.doSomething(req.body);
  res.json(result);
});
```

### Adding Database Validation

```javascript
const { validationService } = require('../utils/validationService');

router.post('/:booking_id/reschedule', authenticateToken, async (req, res) => {
  try {
    const { new_date, new_time } = req.body;

    // Validate input
    if (!new_date || !new_time) {
      throw new ValidationError('Date and time required');
    }

    // Validate format
    if (!validationService.isValidDate(new_date)) {
      throw new ValidationError('Invalid date format');
    }

    // Proceed...
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});
```

### Applying Rate Limiting

```javascript
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply to login endpoint
router.post('/login', rateLimiter.authLimiter, (req, res) => {
  // Login logic
});

// Apply to public booking
router.post('/book', rateLimiter.bookingLimiter, (req, res) => {
  // Booking logic
});
```

### Sending Notifications

```javascript
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// After booking creation
await emailService.sendBookingConfirmation(customerEmail, bookingData);
await smsService.sendBookingConfirmation(customerPhone, bookingData);
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- publicBooking.test.js

# Watch mode (re-run on save)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## 🗄️ Database Migrations

### Create New Table

1. **Add SQL to migrate-advanced.sql**:
```sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Run migration**:
```bash
npm run db:migrate-advanced
```

### Add Column to Existing Table

```sql
ALTER TABLE bookings 
ADD COLUMN new_column VARCHAR(255);
```

---

## 📊 Monitoring & Debugging

### View Logs
```bash
# Development (console)
npm run dev

# Production
tail -f /var/log/smartbook/app.log
```

### Check Database Connection
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Clear Cache
```bash
redis-cli FLUSHDB
```

### Monitor Performance
```bash
# CPU & Memory
top -p $(pgrep -f "node server.js")

# Database slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

## 📚 Key Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| express | Web framework | `app.use()`, `router.post()` |
| pg | PostgreSQL client | `pool.query()` |
| jsonwebtoken | JWT auth | `jwt.sign()`, `jwt.verify()` |
| bcryptjs | Password hashing | `bcrypt.hash()`, `bcrypt.compare()` |
| stripe | Payment processing | `stripe.customers.create()` |
| nodemailer | Email sending | `transporter.sendMail()` |
| twilio | SMS sending | `client.messages.create()` |
| redis | Caching | `redisClient.get()`, `set()` |
| pdfkit | PDF generation | `new PDFDocument()` |
| node-schedule | Job scheduling | `schedule.scheduleJob()` |
| speakeasy | 2FA tokens | `totp.verify()` |
| googleapis | Google APIs | `google.calendar.events.insert()` |

---

## 🔒 Security Checklist

- [x] Password hashing with bcryptjs
- [x] JWT token-based auth
- [x] Input validation on all routes
- [x] SQL injection prevention (parameterized queries)
- [x] Rate limiting on sensitive endpoints
- [x] CORS configured
- [x] Helmet.js security headers
- [x] Environment variables for secrets
- [ ] HTTPS in production
- [ ] Audit logging
- [ ] GDPR compliance

---

## 🐛 Common Issues & Fixes

**Issue**: "Connect ECONNREFUSED" (Database error)  
**Fix**: Check DATABASE_URL and PostgreSQL is running
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**Issue**: "Redis connection refused"  
**Fix**: Check Redis is running and REDIS_URL is correct
```bash
redis-cli ping
```

**Issue**: "Invalid JWT token"  
**Fix**: Ensure JWT_SECRET matches, token is fresh, and Authorization header is correct
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

**Issue**: Email not sending  
**Fix**: Check SMTP credentials and verify email template
```bash
npm test -- emailService.test.js
```

---

## 📞 Support Resources

- **API Documentation**: `/docs/API.md`
- **Deployment Guide**: `/docs/TESTING_AND_DEPLOYMENT.md`
- **Architecture**: `/docs/IMPLEMENTATION_STATUS.md`
- **Issues**: Check logs in `/var/log/smartbook/`
- **Errors**: View Sentry dashboard at `https://sentry.io/`

---

**Last Updated**: March 26, 2026  
**Version**: 2.0
