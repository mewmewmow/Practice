# SmartBook API Documentation

## Base URL
```
Production: https://api.smartbook.com/api
Development: http://localhost:3001/api
```

## Authentication
All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔑 Authentication Endpoints

### Register Business
```
POST /auth/register
Content-Type: application/json

{
  "email": "owner@salon.com",
  "password": "secure_password",
  "business_name": "John's Hair Salon",
  "phone": "+1-555-0123"
}

Response (201):
{
  "message": "Business registered successfully",
  "token": "eyJhbGc...",
  "business_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "owner@salon.com",
  "password": "secure_password"
}

Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "business_id": "550e8400-..."
}
```

---

## 📋 Services Endpoints

### Get All Services
```
GET /services/:business_id
Authorization: Bearer <token>

Response (200):
[
  {
    "id": "uuid",
    "business_id": "uuid",
    "name": "Haircut",
    "description": "Professional haircut",
    "duration_minutes": 45,
    "price": 35.00,
    "color": "#3498db",
    "active": true,
    "created_at": "2026-03-26T10:00:00Z"
  }
]
```

### Create Service
```
POST /services
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_id": "uuid",
  "name": "Haircut",
  "description": "Professional haircut",
  "duration_minutes": 45,
  "price": 35.00,
  "color": "#3498db"
}

Response (201):
{
  "message": "Service created",
  "service_id": "550e8400-..."
}
```

### Update Service
```
PUT /services/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Haircut",
  "price": 45.00,
  "duration_minutes": 60,
  "active": true
}

Response (200):
{
  "message": "Service updated"
}
```

### Delete Service
```
DELETE /services/:id
Authorization: Bearer <token>

Response (200):
{
  "message": "Service deleted"
}
```

---

## 📅 Bookings Endpoints

### Create Booking
```
POST /bookings
Content-Type: application/json

{
  "business_id": "uuid",
  "service_id": "uuid",
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "customer_phone": "+1-555-0456",
  "booking_date": "2026-03-30",
  "start_time": "14:30"
}

Response (201):
{
  "message": "Booking created",
  "booking_id": "550e8400-...",
  "amount": 35.00
}
```

### Get Bookings
```
GET /bookings/:business_id
Authorization: Bearer <token>

Query Parameters:
- status: confirmed, pending, cancelled
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD

Response (200):
[
  {
    "id": "uuid",
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "service_name": "Haircut",
    "booking_date": "2026-03-30",
    "start_time": "14:30",
    "end_time": "15:15",
    "price": 35.00,
    "status": "confirmed",
    "payment_status": "completed"
  }
]
```

### Update Booking Status
```
PATCH /bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed" // or "pending", "cancelled"
}

Response (200):
{
  "message": "Booking updated"
}
```

---

## ⏰ Availability Endpoints

### Get Availability
```
GET /availability/:business_id
Authorization: Bearer <token>

Response (200):
[
  {
    "id": "uuid",
    "business_id": "uuid",
    "day_of_week": 0,
    "start_time": "09:00",
    "end_time": "17:00"
  }
]
```

### Set Availability
```
POST /availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_id": "uuid",
  "day_of_week": 0,           // 0=Sunday, 1=Monday, etc.
  "start_time": "09:00",
  "end_time": "17:00"
}

Response (201):
{
  "message": "Availability slot created",
  "slot_id": "550e8400-..."
}
```

---

## 👥 Customers Endpoints

### Get All Customers
```
GET /customers/:business_id
Authorization: Bearer <token>

Response (200):
[
  {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0456",
    "total_bookings": 5,
    "total_spent": 175.00,
    "last_booking_date": "2026-03-26",
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

## 💳 Payments Endpoints

### Create Payment Intent
```
POST /payments/create-payment-intent
Content-Type: application/json

{
  "booking_id": "uuid",
  "amount": 35.00,
  "business_email": "owner@salon.com"
}

Response (200):
{
  "clientSecret": "pi_test_...",
  "payment_id": "pi_test_..."
}

// Use clientSecret with Stripe.js on frontend
```

### Confirm Payment
```
POST /payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": "uuid",
  "payment_id": "pi_test_..."
}

Response (200):
{
  "message": "Payment confirmed"
}
```

---

## 📊 Analytics Endpoints

### Get Analytics
```
GET /analytics/:business_id
Authorization: Bearer <token>

Query Parameters:
- start_date: YYYY-MM-DD (optional)
- end_date: YYYY-MM-DD (optional)

Response (200):
{
  "analytics": [
    {
      "date": "2026-03-26",
      "bookings_count": 12,
      "revenue": 420.00,
      "customers_total": 8,
      "no_shows": 1
    }
  ],
  "totals": {
    "total_bookings": 350,
    "total_revenue": 12250.00,
    "avg_daily_bookings": 8.5
  }
}
```

---

## Error Responses

### Standard Error Format
```
{
  "error": "Human-readable error message"
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (permission denied)
- **404**: Not found
- **500**: Server error

### Example Error Responses

```json
{
  "error": "Invalid email"
}

{
  "error": "Password must be at least 8 characters"
}

{
  "error": "Service not found"
}

{
  "error": "Access token required"
}
```

---

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648298400
```

---

## Webhooks

### Webhook Events
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.completed`
- `payment.failed`
- `subscription.upgraded`

### Register Webhook
```
POST /webhooks/register
Authorization: Bearer <token>

{
  "url": "https://yourdomain.com/webhook",
  "events": ["booking.created", "payment.completed"]
}
```

### Webhook Payload Example
```json
{
  "event": "booking.created",
  "timestamp": "2026-03-26T10:00:00Z",
  "data": {
    "id": "uuid",
    "customer_name": "Jane Doe",
    "booking_date": "2026-03-30",
    "amount": 35.00
  }
}
```

---

## SDK Code Examples

### JavaScript/TypeScript
```javascript
const smartbook = require('smartbook-sdk');

const client = new smartbook.Client({
  apiKey: 'sk_test_xxx',
  businessId: 'uuid'
});

// Create booking
const booking = await client.bookings.create({
  service_id: 'uuid',
  customer_name: 'Jane Doe',
  customer_email: 'jane@example.com',
  booking_date: '2026-03-30',
  start_time: '14:30'
});

// Get bookings
const bookings = await client.bookings.list();
```

### Python
```python
import smartbook

client = smartbook.Client(
    api_key='sk_test_xxx',
    business_id='uuid'
)

# Create booking
booking = client.bookings.create(
    service_id='uuid',
    customer_name='Jane Doe',
    customer_email='jane@example.com',
    booking_date='2026-03-30',
    start_time='14:30'
)

# Get analytics
analytics = client.analytics.get()
```

---

## Support

**API Status**: https://status.smartbook.com
**Documentation**: https://docs.smartbook.com
**Email**: api-support@smartbook.com
**Discord**: https://discord.gg/smartbook
