const mongoose = require('mongoose');

const authUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'mentor', 'student'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('AuthUser', authUserSchema);
