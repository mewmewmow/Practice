# Project Structure Reference

## Overview
SmartBook SaaS is a modern, full-stack booking platform with three main components: Backend API, Customer Frontend, and Admin Dashboard.

## Directory Structure

```
Practice/
├── .github/
│   └── workflows/
│       └── test.yml                 # GitHub Actions CI/CD pipeline
├── booking-saas/
│   ├── backend/                     # Node.js/Express API Server
│   │   ├── routes/                  # API endpoints (18 routes)
│   │   │   ├── auth.js              # Authentication (register/login/JWT)
│   │   │   ├── services.js          # Service management (CRUD)
│   │   │   ├── bookings.js          # Booking creation & management
│   │   │   ├── customers.js         # Customer CRM
│   │   │   ├── availability.js      # Availability scheduling
│   │   │   ├── payments.js          # Stripe payment processing
│   │   │   ├── analytics.js         # Basic analytics
│   │   │   ├── publicBooking.js     # Public booking link
│   │   │   ├── recurringBookings.js # Recurring appointments
│   │   │   ├── cancellationAndReschedule.js
│   │   │   ├── teamMembers.js       # Team collaboration
│   │   │   ├── invoicing.js         # Invoice generation (PDF)
│   │   │   ├── advancedAnalytics.js # Advanced reporting
│   │   │   ├── googleCalendar.js    # Google Calendar sync
│   │   │   ├── twoFactorAuth.js     # 2FA TOTP
│   │   │   ├── pricing.js           # SaaS pricing tiers
│   │   │   ├── zapierIntegration.js # Zapier webhooks
│   │   │   └── onboarding.js        # Onboarding flows
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication middleware
│   │   │   └── rateLimiter.js       # Rate limiting (3 profiles)
│   │   ├── services/
│   │   │   ├── emailService.js      # Email (Sendgrid/Nodemailer)
│   │   │   ├── smsService.js        # SMS (Twilio)
│   │   │   ├── notificationService.js # Notifications
│   │   │   └── cacheService.js      # Redis caching
│   │   ├── utils/
│   │   │   ├── validationService.js # Input validation (10 validators)
│   │   │   └── errors.js            # Custom error classes (6 types)
│   │   ├── scripts/
│   │   │   ├── migrate.js           # Database migration runner
│   │   │   ├── migrate.sql          # Core schema (8 tables)
│   │   │   ├── migrate-advanced.js  # Advanced migration runner
│   │   │   └── migrate-advanced.sql # Advanced schema (6 tables)
│   │   ├── server.js                # Express app & middleware setup
│   │   ├── package.json             # Backend dependencies (20+)
│   │   └── .env.example             # Environment variables template
│   │
│   ├── frontend/                    # React Customer App
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.js
│   │   │   │   ├── DashboardPage.js
│   │   │   │   ├── BookingPage.js
│   │   │   │   └── SettingsPage.js
│   │   │   ├── App.js
│   │   │   ├── index.js
│   │   │   └── index.css
│   │   ├── public/
│   │   ├── package.json
│   │   └── .gitignore
│   │
│   ├── admin-dashboard/             # React Admin Dashboard
│   │   ├── src/
│   │   │   ├── App.js
│   │   │   ├── index.js
│   │   │   ├── index.css
│   │   │   └── components/
│   │   ├── public/
│   │   ├── package.json
│   │   └── .gitignore
│   │
│   ├── docs/                        # Documentation (10 guides)
│   │   ├── README.md                # Index & overview
│   │   ├── API.md                   # API reference (18 endpoints)
│   │   ├── DEPLOYMENT.md            # Deployment guide
│   │   ├── TESTING_AND_DEPLOYMENT.md
│   │   ├── QUICK_REFERENCE.md       # Quick start
│   │   ├── IMPLEMENTATION_STATUS.md # Feature status
│   │   ├── LAUNCH_GUIDE.md          # Go-to-market
│   │   ├── MARKETING.md             # Marketing templates
│   │   ├── BUSINESS_MODEL.md        # Revenue model
│   │   └── PROPOSALS.md             # Client proposals
│   │
│   ├── AUDIT_REPORT.md              # System audit (12 issues identified)
│   ├── FIXES_APPLIED.md             # Detailed fix documentation
│   └── IMPLEMENTATION_SUMMARY.md    # Feature summary
│
├── docs/                            # Root documentation (optional)
├── .gitignore                       # Git ignore rules
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier formatting
├── LICENSE                          # MIT License
├── CONTRIBUTING.md                  # Contribution guidelines
├── CODE_OF_CONDUCT.md               # Community standards
├── README.md                        # Main README
└── package-lock.json                # Lock file
```

## File Counts

| Component | Routes | Services | Utils | Docs |
|-----------|--------|----------|-------|------|
| Backend | 18 | 4 | 2 | - |
| Frontend | - | - | - | - |
| Admin Dashboard | - | - | - | - |
| Documentation | - | - | - | 10 |
| **TOTAL** | **18** | **4** | **2** | **10** |

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 12+
- **Cache**: Redis 6+ (optional)
- **Auth**: JWT (jsonwebtoken)
- **Payments**: Stripe (stripe)
- **Email**: Sendgrid/Nodemailer
- **SMS**: Twilio
- **Storage**: PostgreSQL (14 tables)

### Frontend
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **HTTP**: axios
- **Calendar**: React Calendar
- **Payment UI**: Stripe Elements

### Admin Dashboard
- **Framework**: React 18+
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **State**: React Hooks

## Database Schema

### Core Tables (migrate.sql)
1. `businesses` - Business/company management
2. `services` - Service offerings
3. `bookings` - Appointment bookings
4. `customers` - Customer information
5. `availability` - Time slots
6. `payments` - Transaction history
7. `users` - User accounts (login credentials)
8. `reviews` - Customer testimonials

### Advanced Tables (migrate-advanced.sql)
1. `team_members` - Team collaboration
2. `invoices` - Invoice management
3. `customer_reviews` - Rating system
4. `trials` - Trial management
5. `api_usage` - Usage tracking
6. `integrations` - Third-party integrations

**Total**: 14 tables with 65+ columns

## API Endpoints (18 Routes)

### Authentication (6)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/verify-token

### Services (6)
- GET /api/services
- POST /api/services
- PUT /api/services/{id}
- DELETE /api/services/{id}
- GET /api/services/{id}
- GET /api/services/business/{businessId}

### Bookings (12+)
- GET /api/bookings
- POST /api/bookings
- PUT /api/bookings/{id}
- DELETE /api/bookings/{id}
- + 8+ advanced routes (recurring, cancellation, etc.)

### Other (15+)
- Payments, Analytics, Customers, Availability, etc.

## Key Features (15 Total)

### Core Features (7)
1. User authentication (JWT)
2. Service management
3. Booking creation & management
4. Customer CRM
5. Payment processing (Stripe)
6. Availability scheduling
7. Analytics & reporting

### Advanced Features (8)
8. Public booking link/calendar
9. Recurring bookings
10. Cancellation & rescheduling
11. Team member management
12. Invoice generation (PDF)
13. Google Calendar integration
14. Zapier integration
15. Usage-based pricing tiers

## Code Statistics

- **Total Lines**: 1,500+ production code
- **API Routes**: 18 fully-built endpoints
- **Database Tables**: 14 (8 core + 6 advanced)
- **Services**: 4 (email, SMS, cache, notification)
- **Middleware**: 2 (auth, rate-limiter)
- **Utils**: 2 (validation, errors)
- **Documentation**: 10+ comprehensive guides

## Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `.eslintrc.js` | Code linting rules |
| `.prettierrc` | Code formatting |
| `package.json` | Dependencies & scripts |
| `.gitignore` | Git exclusions |
| `CONTRIBUTING.md` | Contribution guidelines |

## Running the Application

### Backend
```bash
cd booking-saas/backend
npm install
cp .env.example .env
npm run db:migrate-advanced
npm run dev
```

### Frontend
```bash
cd booking-saas/frontend
npm install
npm start
```

### Admin Dashboard
```bash
cd booking-saas/admin-dashboard
npm install
npm start
```

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run db:migrate   # Run database migrations
npm test             # Run tests
npm run lint         # Lint code
```

### Frontend & Admin
```bash
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests
```

## Deployment

See [DEPLOYMENT.md](./booking-saas/docs/DEPLOYMENT.md) for:
- Docker deployment
- AWS deployment
- Heroku deployment
- Environment setup
- Database initialization

## Documentation

| Doc | Purpose |
|-----|---------|
| [API.md](./booking-saas/docs/API.md) | Complete API reference |
| [DEPLOYMENT.md](./booking-saas/docs/DEPLOYMENT.md) | Deployment guide |
| [QUICK_REFERENCE.md](./booking-saas/docs/QUICK_REFERENCE.md) | Quick start |
| [LAUNCH_GUIDE.md](./booking-saas/docs/LAUNCH_GUIDE.md) | Go-to-market |
| [TESTING_AND_DEPLOYMENT.md](./booking-saas/docs/TESTING_AND_DEPLOYMENT.md) | Testing guide |

## Support Files

- [FIXES_APPLIED.md](./booking-saas/FIXES_APPLIED.md) - Bug fixes documentation
- [AUDIT_REPORT.md](./booking-saas/AUDIT_REPORT.md) - System audit findings
- [IMPLEMENTATION_SUMMARY.md](./booking-saas/IMPLEMENTATION_SUMMARY.md) - Feature summary

---

**Last Updated**: March 2026  
**Maintained by**: SmartBook SaaS Team
