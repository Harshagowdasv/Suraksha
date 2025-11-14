const User = require('../models/User');

// GET /api/users - return all users
async function getUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

// POST /api/users - create a new user
async function createUser(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const user = await User.create({ name, email });
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
}

module.exports = { getUsers, createUser };
