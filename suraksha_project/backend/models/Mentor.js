const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  assignedStudents: { type: [String], default: [] },
  resources: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
