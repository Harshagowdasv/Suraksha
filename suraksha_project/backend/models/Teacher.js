const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subject: { type: String, required: true, trim: true },
  students: { type: [String], default: [] }, // list of student emails or USNs
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
