const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, business_name, phone } = req.body;

    // Validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM businesses WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    // Create business
    await pool.query(
      'INSERT INTO businesses (id, name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5)',
      [id, business_name, email, password_hash, phone]
    );

    // Generate token
    const token = jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ 
      message: 'Business registered successfully',
      token,
      business_id: id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, password_hash FROM businesses WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const business = result.rows[0];
    const validPassword = await bcrypt.compare(password, business.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: business.id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ 
      message: 'Login successful',
      token,
      business_id: business.id
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
