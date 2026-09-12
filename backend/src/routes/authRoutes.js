const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Log in user (Phase 1 rule: any non-empty username & password succeeds)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, role: requestedRole } = req.body;

    // Rule validation: username and password must both be non-empty strings
    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username.trim() === '' ||
      password.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required and cannot be empty.',
      });
    }

    const trimmedUsername = username.trim();
    let assignedRole = requestedRole || 'patient';
    if (trimmedUsername.toLowerCase().includes('admin')) {
      assignedRole = 'admin';
    } else if (trimmedUsername.toLowerCase().includes('staff') || trimmedUsername.toLowerCase().includes('doctor')) {
      assignedRole = 'staff';
    }

    // Create or find user in DB (for record keeping in DB)
    let user = await User.findOne({ username: trimmedUsername });
    if (!user) {
      user = await User.create({ username: trimmedUsername, password, role: assignedRole });
    } else if (requestedRole && user.role !== requestedRole) {
      user.role = requestedRole;
      await user.save();
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key';
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login authentication.',
    });
  }
});

module.exports = router;
