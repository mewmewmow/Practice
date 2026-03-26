const validator = require('validator');

class ValidationService {
  validateEmail(email) {
    if (!validator.isEmail(email)) {
      return { valid: false, error: 'Invalid email address' };
    }
    return { valid: true };
  }

  validatePhone(phone) {
    // International format: +1-555-0123 or (555) 555-0123
    if (!phone || phone.trim() === '') {
      return { valid: true }; // Phone is optional
    }
    
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number' };
    }
    return { valid: true };
  }

  validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain number' };
    }
    return { valid: true };
  }

  validateBusinessName(name) {
    if (!name || name.trim().length < 2) {
      return { valid: false, error: 'Business name too short' };
    }
    if (name.length > 100) {
      return { valid: false, error: 'Business name too long' };
    }
    return { valid: true };
  }

  validateServiceData(service) {
    if (!service.name || service.name.trim().length < 1) {
      return { valid: false, error: 'Service name required' };
    }
    if (service.price === undefined || service.price < 0) {
      return { valid: false, error: 'Invalid price' };
    }
    if (service.duration_minutes < 5 || service.duration_minutes > 480) {
      return { valid: false, error: 'Duration must be between 5-480 minutes' };
    }
    return { valid: true };
  }

  validateBookingData(booking) {
    const emailValidation = this.validateEmail(booking.customer_email);
    if (!emailValidation.valid) return emailValidation;

    if (!booking.customer_name || booking.customer_name.trim().length < 2) {
      return { valid: false, error: 'Invalid customer name' };
    }

    if (!booking.booking_date || !this.isValidDate(booking.booking_date)) {
      return { valid: false, error: 'Invalid booking date' };
    }

    if (!booking.start_time || !this.isValidTime(booking.start_time)) {
      return { valid: false, error: 'Invalid start time' };
    }

    // Check booking is in the future
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    if (bookingDateTime < new Date()) {
      return { valid: false, error: 'Cannot book in the past' };
    }

    return { valid: true };
  }

  isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  isValidTime(timeStr) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  }

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return validator.escape(input.trim());
    }
    return input;
  }

  sanitizeUserInput(obj) {
    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = this.sanitizeInput(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }
}

module.exports = new ValidationService();
