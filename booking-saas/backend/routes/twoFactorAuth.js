const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Generate 2FA secret
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `SmartBook (${user_id})`,
      issuer: 'SmartBook',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qr_code: qrCode,
      backup_codes: generateBackupCodes()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
});

// Enable 2FA
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const { user_id, secret, token } = req.body;

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Store secret in database
    await pool.query(
      'UPDATE businesses SET two_factor_secret = $1, two_factor_enabled = true WHERE id = $2',
      [secret, user_id]
    );

    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Verify 2FA token during login
router.post('/verify', async (req, res) => {
  try {
    const { user_id, token } = req.body;

    const userResult = await pool.query(
      'SELECT two_factor_secret FROM businesses WHERE id = $1 AND two_factor_enabled = true',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: userResult.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    await pool.query(
      'UPDATE businesses SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [user_id]
    );

    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Get 2FA status
router.get('/:user_id/status', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT two_factor_enabled FROM businesses WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      enabled: result.rows[0].two_factor_enabled 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch 2FA status' });
  }
});

function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateRandomCode());
  }
  return codes;
}

function generateRandomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = router;
