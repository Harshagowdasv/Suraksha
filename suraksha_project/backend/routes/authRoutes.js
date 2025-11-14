const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthUser = require('../models/AuthUser');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (role && role.toLowerCase() === 'student') {
      return res.status(400).json({ success: false, message: 'Students cannot self-register. Student accounts are created by the teacher upload.' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }
    const existing = await AuthUser.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const newUser = new AuthUser({ name, email, password: hash, role });
    await newUser.save();
    return res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ msg: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AuthUser.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ msg: 'JWT secret not configured' });
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      secret,
      { expiresIn: '2h' }
    );
    return res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
