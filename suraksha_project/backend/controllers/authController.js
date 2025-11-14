const jwt = require('jsonwebtoken');

async function login(req, res) {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'email and role are required' });
    }
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const token = jwt.sign({ email, role }, secret, { expiresIn: '7d' });
    return res.status(200).json({ success: true, token });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
}

module.exports = { login };
