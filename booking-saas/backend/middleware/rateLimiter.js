const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful requests
});

// Booking creation rate limiter
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 bookings per minute per IP
  message: 'Too many bookings, please try again later'
});

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter
};
