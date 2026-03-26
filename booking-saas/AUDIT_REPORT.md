# 🔍 SmartBook SaaS - Comprehensive Code Audit Report

**Audit Date**: March 26, 2026  
**Scope**: Backend API (routes, services, middleware, utilities)  
**Status**: 12 Critical Issues Found (Fixable)

---

## 📊 Issue Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Needs Fix |
| 🟠 High | 4 | Needs Fix |
| 🟡 Medium | 3 | Needs Fix |
| 🟢 Low | 2 | Optional |
| **TOTAL** | **12** | - |

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### CRITICAL #1: Stripe Initialization Fails on Missing Env Variable
**File**: `backend/routes/payments.js`, `backend/routes/bookings.js`, `backend/routes/pricing.js`  
**Issue**: Stripe is initialized with `process.env.STRIPE_SECRET_KEY` at module load time  
**Problem**: If `STRIPE_SECRET_KEY` is undefined, Stripe throws error  
**Lines Affected**:
- payments.js:2
- bookings.js:5
- pricing.js:4

**Current Code**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ❌ FAILS IF UNDEFINED
```

**Fix**: Initialize Stripe lazily or add guard
```javascript
// Option 1: Lazy initialization
let stripe;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Then use: const stripeClient = getStripe();
```

---

### CRITICAL #2: Missing `users` Table References
**File**: `backend/routes/twoFactorAuth.js`  
**Issue**: Routes reference `users` table that doesn't exist in schema  
**Lines Affected**:
- Line 45: `UPDATE users SET two_factor_secret...`
- Line 80: `SELECT two_factor_enabled FROM users...`

**Current Code**:
```javascript
await pool.query(
  'UPDATE users SET two_factor_secret = $1, two_factor_enabled = true WHERE id = $2',
  [secret, user_id]
);
```

**Problem**: Database schema only has `businesses` table, not `users`

**Fix**: Change to use `businesses` table instead:
```javascript
await pool.query(
  'UPDATE businesses SET two_factor_secret = $1, two_factor_enabled = true WHERE id = $2',
  [secret, user_id]
);
```

---

### CRITICAL #3: Missing `users` Column Definitions in Migration
**File**: `backend/scripts/migrate-advanced.sql`  
**Issue**: `twoFactorAuth.js` expects columns that aren't defined in migration  
**Missing Columns in `businesses` table**:
- `two_factor_secret`
- `two_factor_enabled`
- **Also referenced in `pricing.js`**: `pricing_tier`, `subscription_id`, `subscription_status`, `stripe_customer_id`
- **Also in `onboarding.js`**: `onboarding_step`, `onboarding_completed`
- **Also in `googleCalendar.js`**: `google_calendar_event_id` (in bookings table)

**Fix**: Add to `migrate-advanced.sql`:
```sql
-- Add columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);
```

---

## 🟠 HIGH-PRIORITY ISSUES

### HIGH #1: Google Calendar OAuth Missing Environment Variables
**File**: `backend/routes/googleCalendar.js`  
**Lines**: 11-16  
**Issue**: Initializes OAuth2 client at module load time with potentially undefined env vars

**Current Code**:
```javascript
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,           // ❌ May be undefined
  process.env.GOOGLE_CLIENT_SECRET,       // ❌ May be undefined
  process.env.GOOGLE_REDIRECT_URI         // ❌ May be undefined
);
```

**Fix**: Add validation
```javascript
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google Calendar integration disabled: Missing credentials');
}

const oauth2Client = process.env.GOOGLE_CLIENT_ID 
  ? new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  : null;

// Then guard routes:
router.get('/google/auth-url', (req, res) => {
  if (!oauth2Client) {
    return res.status(503).json({ error: 'Google Calendar not configured' });
  }
  // ... rest of code
});
```

---

### HIGH #2: Redis Connection Error on Startup
**File**: `backend/services/cacheService.js`  
**Lines**: 3-6  
**Issue**: Redis client tries to connect at module import time, crashes if Redis unavailable

**Current Code**:
```javascript
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error); // ❌ Crash if fails
```

**Problem**: Application startup fails if Redis not running

**Fix**: Add graceful fallback
```javascript
let redisClient = null;
let isRedisAvailable = false;

async function initializeRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { connectTimeout: 5000 }
    });
    
    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      isRedisAvailable = false;
    });
    
    await redisClient.connect();
    isRedisAvailable = true;
    console.log('✅ Redis connected');
  } catch (err) {
    console.warn('⚠️ Redis unavailable - caching disabled:', err.message);
    isRedisAvailable = false;
  }
}

// Then in CacheService methods:
async get(key) {
  if (!isRedisAvailable) return null;
  try {
    const data = await redisClient.get(key);
    // ...
  } catch (err) {
    return null; // Fallback
  }
}
```

---

### HIGH #3: EmailService Not Exported Properly
**File**: `backend/services/emailService.js`  
**Issue**: Service exports instance but routes access `.transporter` property

**Current Code in routes**:
```javascript
await emailService.transporter.sendMail(...) // ❌ transporter not exported
```

**Current Export in service**:
```javascript
module.exports = emailService; // Only exports class instance methods
```

**Fix**: Export both service and transporter
```javascript
module.exports = {
  sendBookingConfirmation: emailService.sendBookingConfirmation.bind(emailService),
  sendReminderEmail: emailService.sendReminderEmail.bind(emailService),
  sendCancellationEmail: emailService.sendCancellationEmail.bind(emailService),
  sendReviewRequest: emailService.sendReviewRequest.bind(emailService),
  sendInvoice: emailService.sendInvoice.bind(emailService),
  transporter  // ✅ Export transporter for direct use
};
```

---

### HIGH #4: Cache Service Missing Export and Init Function
**File**: `backend/services/cacheService.js`  
**Issue**: `warmCache()` function is defined but not properly initialized on server startup

**Current Code**:
```javascript
// At end of file
const cacheService = new CacheService();

module.exports = {
  cacheService,
  warmCache,
  redisClient
};
```

**Problem**: `warmCache()` is called in documentation but never invoked in server.js

**Fix**: Add to `server.js` after database connects:
```javascript
// In server.js after pool creation:
const { cacheService, warmCache } = require('./services/cacheService');

pool.once('connect', async () => {
  console.log('✅ Database connected');
  try {
    await warmCache();
  } catch (err) {
    console.warn('⚠️ Cache warming skipped:', err.message);
  }
});
```

---

## 🟡 MEDIUM-PRIORITY ISSUES

### MEDIUM #1: Missing Environment Variable Documentation
**Files**: Multiple (publicBooking.js, recurringBookings.js, invoicing.js, etc.)  
**Issue**: Required env variables not documented in `.env.example`

**Fix**: Update `.env.example`:
```bash
# Email Service (Choose one)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SENDGRID_API_KEY=your_sendgrid_key_here

# SMS Service
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/google/callback

# Caching
REDIS_URL=redis://localhost:6379

# Integrations
ZAPIER_WEBHOOK_TOKEN=your_webhook_token

# App Configuration
NODE_ENV=production
APP_URL=https://app.smartbook.com
API_URL=https://api.smartbook.com
```

---

### MEDIUM #2: No Constraint on Integration Table
**File**: `backend/scripts/migrate-advanced.sql`  
**Issue**: `googleCalendar.js` assumes unique constraint doesn't exist:
```sql
ON CONFLICT (business_id, integration_type) DO UPDATE...
```

**Problem**: This constraint isn't defined in migration

**Fix**: Add to migration:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_unique 
  ON integrations(business_id, integration_type);
```

---

### MEDIUM #3: Error Handling Inconsistency
**File**: Multiple route files  
**Issue**: Some routes throw custom errors, others don't use error service

**Example from publicBooking.js**:
```javascript
throw new NotFoundError('Business');  // ✅ Good
```

**Example from recurringBookings.js**:
```javascript
return res.status(400).json({ error: 'Invalid recurrence type' }); // ❌ Inconsistent
```

**Fix**: Use consistent error handling throughout:
```javascript
// WRONG - Don't do this:
if (!['weekly', 'biweekly', 'monthly'].includes(recurrence_type)) {
  return res.status(400).json({ error: 'Invalid recurrence type' });
}

// RIGHT - Do this:
if (!['weekly', 'biweekly', 'monthly'].includes(recurrence_type)) {
  throw new ValidationError('Invalid recurrence type');
}
```

---

## 🟢 LOW-PRIORITY ISSUES

### LOW #1: Markdown Formatting Issues
**Files**: README.md, docs/README.md  
**Issue**: 816 markdown linting errors (blanks around headings, tables)

**Impact**: Documentation readability (not code functionality)

**Fix**: Run markdown linter:
```bash
npm install -g markdownlint-cli2
markdownlint-cli2 "**/*.md"
```

---

### LOW #2: Missing Error Boundary in Async Operations
**File**: `backend/services/cacheService.js`  
**Function**: `warmCache()`

**Current**:
```javascript
for (const business of businesses.rows) {
  const services = await pool.query(...); // ❌ No error handling
  await cacheService.set(...);
}
```

**Fix**: Add try-catch
```javascript
for (const business of businesses.rows) {
  try {
    const services = await pool.query(...);
    await cacheService.set(...);
  } catch (err) {
    console.error(`Failed to warm cache for business ${business.id}:`, err.message);
    continue; // Don't crash, continue with next business
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

Run these checks to verify fixes:

```bash
# 1. Check environment variables are set
env | grep -E "STRIPE_SECRET_KEY|GOOGLE_CLIENT_ID|REDIS_URL"

# 2. Verify database schema
psql $DATABASE_URL -c "\dt businesses" # Check columns

# 3. Test server startup
npm run dev # Should start without errors

# 4. Check Redis connectivity
redis-cli ping # Should return PONG

# 5. Verify module exports
node -e "require('./backend/services/emailService')" # Should not error

# 6. Run linting
npm run test # If configured

# 7. Check all routes load
curl http://localhost:3000/health # Should return { status: 'ok' }
```

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### Phase 1: CRITICAL (Do First - 30 mins)
- [ ] Fix Stripe initialization with guard
- [ ] Change `users` table refs to `businesses`
- [ ] Add missing columns to migration
- [ ] Re-run migration: `npm run db:migrate-advanced`

### Phase 2: HIGH (Do Next - 1 hour)
- [ ] Add Google OAuth guard
- [ ] Implement Redis fallback
- [ ] Export emailService properly
- [ ] Initialize cache on startup
- [ ] Update `.env.example`

### Phase 3: MEDIUM (Do After - 1 hour)
- [ ] Add database constraint
- [ ] Standardize error handling
- [ ] Add error boundaries in loops

### Phase 4: LOW (Optional - 30 mins)
- [ ] Fix markdown linting
- [ ] Add comprehensive logging

---

## 📋 Summary: Running State

**Current Status**: ⚠️ **Will Start but May Crash on First Use**

**Working**:
- ✅ Express server configuration
- ✅ Route definitions and exports
- ✅ Middleware (auth, rate limiting)
- ✅ Utility services (validation, errors)

**Not Working Without Fixes**:
- ❌ Stripe operations (undefined env var)
- ❌ 2FA routes (wrong table)
- ❌ Google Calendar (undefined credentials)
- ❌ Caching (Redis not initialized)
- ❌ Email sending (transporter not exported)

**Cannot Start**:
- ✅ Server will start (dependencies exist)
- ❌ But API calls will fail

---

## 🚀 Next Steps

1. **Immediate**: Apply CRITICAL fixes above
2. **Before Deployment**: Apply HIGH priority fixes  
3. **Before Production**: Complete MEDIUM fixes
4. **Optional**: Clean up LOW priority issues

**Estimated Time to Fix**: 2-3 hours

---

## 📞 Questions?

Check:
- [IMPLEMENTATION_STATUS.md](../docs/IMPLEMENTATION_STATUS.md) - Feature details
- [QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md) - Developer guide
- [TESTING_AND_DEPLOYMENT.md](../docs/TESTING_AND_DEPLOYMENT.md) - Deployment

