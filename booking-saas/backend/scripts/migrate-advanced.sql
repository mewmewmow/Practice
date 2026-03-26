-- Migration: Add advanced features tables
-- Run: node scripts/migrate-advanced.js

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'staff', 'viewer')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'pending', 'inactive')),
  invitation_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  due_date DATE,
  paid_date DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'sent', 'unpaid', 'paid', 'overdue')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add recurring bookings support
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS series_id UUID,
ADD COLUMN IF NOT EXISTS management_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(50) CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly', NULL));

CREATE INDEX IF NOT EXISTS idx_bookings_series_id ON bookings(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(management_token) WHERE management_token IS NOT NULL;

-- Customer reviews and ratings
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON customer_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON customer_reviews(booking_id);

-- Trial management
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'converted')),
  bookings_limit INT DEFAULT 50,
  bookings_used INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trials_business_id ON trials(business_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);

-- Usage tracking for analytics
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time_ms INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_business_id ON api_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);

-- Update bookings table to track cancellation reasons
ALTER TABLE IF EXISTS bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;

-- Integration tracking
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'error')),
  auth_token TEXT,
  config JSONB,
  last_sync TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_business_id ON integrations(business_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);

-- Add unique constraint for integrations to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_unique ON integrations(business_id, integration_type);

-- Add 2FA support to businesses table
ALTER TABLE IF EXISTS businesses
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Add pricing and subscription support to businesses table
ALTER TABLE IF EXISTS businesses
ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(50) DEFAULT 'free' CHECK (pricing_tier IN ('free', 'starter', 'professional')),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add onboarding support to businesses table
ALTER TABLE IF EXISTS businesses
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add Google Calendar integration support to bookings table
ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);
