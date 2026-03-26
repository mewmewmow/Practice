const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Add team member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { business_id, member_name, member_email, role, status } = req.body;

    if (!['owner', 'staff', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const memberId = uuidv4();
    const invitationToken = uuidv4();

    await pool.query(
      `INSERT INTO team_members 
       (id, business_id, name, email, role, status, invitation_token) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [memberId, business_id, member_name, member_email, role, 'pending', invitationToken]
    );

    // Send invitation email
    const invitationLink = `${process.env.APP_URL}/join/${invitationToken}`;

    await emailService.transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: member_email,
      subject: 'You\'ve been invited to join a team',
      html: `
        <h2>Team Invitation</h2>
        <p>${member_name}, you've been invited to join a business team as a ${role}.</p>
        <p><a href="${invitationLink}">Accept Invitation</a></p>
      `
    });

    res.status(201).json({
      message: 'Team member invited',
      invitation_link: invitationLink,
      member_id: memberId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Get team members
router.get('/:business_id', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, role, status, created_at FROM team_members WHERE business_id = $1 ORDER BY created_at DESC',
      [business_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Update team member role
router.patch('/:member_id', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.params;
    const { role } = req.body;

    if (!['owner', 'staff', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.query(
      'UPDATE team_members SET role = $1 WHERE id = $2',
      [role, member_id]
    );

    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Remove team member
router.delete('/:member_id', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.params;

    await pool.query(
      'DELETE FROM team_members WHERE id = $1',
      [member_id]
    );

    res.json({ message: 'Team member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Accept invitation
router.post('/invite/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const memberResult = await pool.query(
      'SELECT * FROM team_members WHERE invitation_token = $1',
      [token]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    const member = memberResult.rows[0];

    // Update status
    await pool.query(
      'UPDATE team_members SET status = $1, invitation_token = NULL WHERE id = $2',
      ['active', member.id]
    );

    res.json({ message: 'Invitation accepted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Get team member permission level
router.get('/:member_id/permissions', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.params;

    const memberResult = await pool.query(
      'SELECT role FROM team_members WHERE id = $1',
      [member_id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const permissions = {
      owner: ['read', 'write', 'delete', 'team_manage', 'billing', 'analytics'],
      staff: ['read', 'write', 'analytics'],
      viewer: ['read', 'analytics']
    };

    const role = memberResult.rows[0].role;
    res.json({
      role,
      permissions: permissions[role] || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

module.exports = router;
