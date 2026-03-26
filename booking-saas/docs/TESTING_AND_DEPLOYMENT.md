# SmartBook SaaS - Comprehensive Testing & Deployment Guide

## 🧪 Part 1: Testing Guide

### Setup Test Environment

```bash
# Install testing dependencies
npm install --save-dev jest supertest dotenv

# Create test database
createdb smartbook_test

# Set test environment
export NODE_ENV=test
export DATABASE_URL=postgresql://user:password@localhost:5432/smartbook_test
```

### Unit Tests for Services

**Test: Email Service** (`backend/services/__tests__/emailService.test.js`)
```javascript
describe('EmailService', () => {
  test('should send booking confirmation email', async () => {
    const result = await emailService.sendBookingConfirmation('test@example.com', {
      service_name: 'Haircut',
      booking_date: '2026-04-01',
      start_time: '10:00',
      end_time: '11:00',
      price: 50,
      business_name: 'Salon ABC'
    });
    
    expect(result.accepted).toContain('test@example.com');
  });
});
```

**Test: Validation Service** (`backend/utils/__tests__/validationService.test.js`)
```javascript
describe('ValidationService', () => {
  test('should validate correct email', () => {
    const result = validationService.validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });

  test('should reject invalid email', () => {
    const result = validationService.validateEmail('invalid-email');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should validate booking data', () => {
    const result = validationService.validateBookingData({
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+1234567890',
      booking_date: '2026-04-05',
      start_time: '14:00'
    });
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests for Routes

**Test: Public Booking Route** (`backend/routes/__tests__/publicBooking.test.js`)
```javascript
describe('Public Booking Routes', () => {
  test('should get business public page', async () => {
    const response = await supertest(app)
      .get('/api/public-booking/salon-abc')
      .expect(200);

    expect(response.body).toHaveProperty('business');
    expect(response.body).toHaveProperty('services');
    expect(response.body).toHaveProperty('availability');
  });

  test('should create public booking', async () => {
    const response = await supertest(app)
      .post('/api/public-booking/salon-abc/book')
      .send({
        service_id: 'service-uuid',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        booking_date: '2026-04-05',
        start_time: '14:00'
      })
      .expect(201);

    expect(response.body).toHaveProperty('booking_id');
    expect(response.body.message).toContain('confirmed');
  });

  test('should get available slots', async () => {
    const response = await supertest(app)
      .get('/api/public-booking/salon-abc/slots/2026-04-05')
      .expect(200);

    expect(Array.isArray(response.body.slots)).toBe(true);
  });
});
```

**Test: Recurring Bookings** (`backend/routes/__tests__/recurringBookings.test.js`)
```javascript
describe('Recurring Bookings', () => {
  test('should create recurring booking series', async () => {
    const response = await supertest(app)
      .post('/api/recurring/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        business_id: 'business-uuid',
        service_id: 'service-uuid',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '+1234567890',
        booking_date: '2026-04-02',
        start_time: '10:00',
        recurrence_type: 'weekly',
        recurrence_count: 4
      })
      .expect(201);

    expect(response.body.booking_ids.length).toBe(4);
    expect(response.body).toHaveProperty('series_id');
  });

  test('should cancel entire series', async () => {
    const response = await supertest(app)
      .delete(`/api/recurring/series/${seriesId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toContain('Cancelled');
  });
});
```

**Test: Team Management** (`backend/routes/__tests__/teamMembers.test.js`)
```javascript
describe('Team Management', () => {
  test('should add team member', async () => {
    const response = await supertest(app)
      .post('/api/team/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        business_id: 'business-uuid',
        member_name: 'Alice Johnson',
        member_email: 'alice@example.com',
        role: 'staff'
      })
      .expect(201);

    expect(response.body).toHaveProperty('member_id');
    expect(response.body).toHaveProperty('invitation_link');
  });

  test('should get team members', async () => {
    const response = await supertest(app)
      .get(`/api/team/${businessId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should update member role', async () => {
    const response = await supertest(app)
      .patch(`/api/team/${memberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'viewer' })
      .expect(200);

    expect(response.body.message).toContain('updated');
  });
});
```

**Test: Pricing Tiers** (`backend/routes/__tests__/pricing.test.js`)
```javascript
describe('Pricing Tiers', () => {
  test('should get available tiers', async () => {
    const response = await supertest(app)
      .get('/api/pricing/tiers')
      .expect(200);

    expect(response.body).toHaveProperty('free');
    expect(response.body).toHaveProperty('starter');
    expect(response.body).toHaveProperty('professional');
  });

  test('should get current tier', async () => {
    const response = await supertest(app)
      .get(`/api/pricing/${businessId}/current`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('current_tier');
    expect(response.body).toHaveProperty('tier_details');
  });

  test('should get usage stats', async () => {
    const response = await supertest(app)
      .get(`/api/pricing/${businessId}/usage`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('bookings_used');
    expect(response.body).toHaveProperty('usage_percent');
  });
});
```

### Postman Collection

Create `SmartBook.postman_collection.json`:

```json
{
  "info": {
    "name": "SmartBook SaaS API",
    "version": "2.0"
  },
  "item": [
    {
      "name": "Public Booking",
      "item": [
        {
          "name": "Get Business Page",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/public-booking/salon-abc"
          }
        },
        {
          "name": "Create Public Booking",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/public-booking/salon-abc/book",
            "body": {
              "service_id": "uuid",
              "customer_name": "John Doe",
              "customer_email": "john@example.com",
              "customer_phone": "+1234567890",
              "booking_date": "2026-04-05",
              "start_time": "14:00"
            }
          }
        },
        {
          "name": "Get Available Slots",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/public-booking/salon-abc/slots/2026-04-05"
          }
        }
      ]
    },
    {
      "name": "Recurring Bookings",
      "item": [
        {
          "name": "Create Recurring Series",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/recurring/",
            "header": {"Authorization": "Bearer {{token}}"},
            "body": {
              "business_id": "uuid",
              "service_id": "uuid",
              "customer_name": "Jane Smith",
              "recurrence_type": "weekly",
              "recurrence_count": 4
            }
          }
        }
      ]
    }
  ]
}
```

### Run Test Suite

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- publicBooking.test.js

# Run in watch mode
npm test -- --watch
```

---

## 🚀 Part 2: Deployment Guide

### Pre-Deployment Checklist

- [ ] All tests passing (npm test)
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL/TLS certificates ready
- [ ] Search engine indexing rules set
- [ ] Analytics configured
- [ ] Error tracking (Sentry) configured
- [ ] Backup system tested
- [ ] Load testing completed (acceptable performance)

### Environment Variables (.env.production)

```bash
# Database
DATABASE_URL=postgresql://user:password@db.example.com:5432/smartbook_prod

# Authentication
JWT_SECRET=your-very-long-secure-random-string-here
JWT_EXPIRE=7d

# External Services
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG....
SMTP_FROM_EMAIL=noreply@smartbook.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://app.smartbook.com/api/calendar/google/callback

# Caching
REDIS_URL=redis://cache.example.com:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Zapier
ZAPIER_WEBHOOK_TOKEN=secure-token-here

# App Settings
NODE_ENV=production
APP_URL=https://app.smartbook.com
API_URL=https://api.smartbook.com
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app
COPY . .

# Run migrations
RUN npm run migrate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://smartbook:password@postgres:5432/smartbook
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=smartbook
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=smartbook
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

volumes:
  postgres_data:
  redis_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create smartbook-api

# Set environment variables
heroku config:set --app smartbook-api NODE_ENV=production
heroku config:set --app smartbook-api JWT_SECRET=your-secret
heroku config:set --app smartbook-api DATABASE_URL=your-db-url

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0 --app smartbook-api

# Add Redis addon
heroku addons:create heroku-redis:premium-0 --app smartbook-api

# Deploy
git push heroku main

# View logs
heroku logs --tail --app smartbook-api
```

### AWS Deployment (ECS)

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag smartbook-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/smartbook-api:latest

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/smartbook-api:latest

# Deploy to ECS cluster
aws ecs update-service --cluster smarter-book --service api --force-new-deployment
```

### Monitoring & Observability

```bash
# Install monitoring stack
npm install prom-client winston

# Configure logging (backend/config/logging.js)
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Performance Optimization

```javascript
// Enable gzip compression
const compression = require('compression');
app.use(compression());

// Set cache-control headers
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'private, max-age=3600');
  }
  next();
});

// Set security headers
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

### SSL/TLS Configuration (Nginx)

```nginx
server {
  listen 443 ssl http2;
  server_name api.smartbook.com;

  ssl_certificate /etc/ssl/certs/smartbook.com.crt;
  ssl_certificate_key /etc/ssl/private/smartbook.com.key;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  gzip on;
  gzip_types text/plain application/json;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.smartbook.com;
  return 301 https://$server_name$request_uri;
}
```

### Zero-Downtime Deployment

```bash
#!/bin/bash
# deploy.sh

# Build new image
docker build -t smartbook-api:new .

# Start new container
docker run -d \
  --name smartbook-api-new \
  -e DATABASE_URL=$DATABASE_URL \
  -p 3001:3000 \
  smartbook-api:new

# Run health checks
sleep 5
curl http://localhost:3001/health || exit 1

# Swap traffic
docker exec nginx nginx -s reload

# Stop old container
docker stop smartbook-api-old
docker rm smartbook-api-old

# Rename new container
docker rename smartbook-api-new smartbook-api-old
```

### Backup Strategy

```bash
# Database backups (daily)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/smartbook-$(date +\%Y-\%m-\%d).sql.gz

# Keep 30 days of backups
find /backups -name "smartbook-*.sql.gz" -mtime +30 -delete

# Upload to S3
0 2 * * * aws s3 cp /backups/smartbook-$(date +\%Y-\%m-\%d).sql.gz s3://smartbook-backups/
```

### Post-Deployment Verification

```bash
# Check health endpoint
curl https://api.smartbook.com/health

# Verify database connection
curl https://api.smartbook.com/api/auth/health

# Test public booking
curl https://api.smartbook.com/api/public-booking/test-business

# Monitor logs
tail -f /var/log/smartbook/error.log
```

---

## 🔍 Performance Tuning

### Database Query Optimization

```sql
-- Index creation for frequently queried columns
CREATE INDEX idx_bookings_business_date ON bookings(business_id, booking_date);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_team_members_business_role ON team_members(business_id, role);
CREATE INDEX idx_invoices_status_date ON invoices(status, created_at);

-- Query performance monitoring
EXPLAIN ANALYZE 
SELECT * FROM bookings WHERE business_id = $1 AND booking_date > NOW();
```

### API Response Time Targets

- Public booking page: < 200ms
- Create booking: < 500ms
- Get analytics: < 1000ms (optimized with caching)
- Generate invoice PDF: < 800ms

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load-test.yml
targets:
  - "https://api.smartbook.com"

scenarios:
  - flow:
      - get:
          url: "/health"
      - post:
          url: "/api/public-booking/test/book"
          json:
            booking_data: ...

# Run test
artillery run load-test.yml
```

---

**Last Updated**: March 26, 2026  
**Status**: Ready for production deployment
