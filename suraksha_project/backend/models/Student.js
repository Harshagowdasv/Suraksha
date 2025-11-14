const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  usn: { type: String, required: true, unique: true, trim: true },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  attendance: { type: Number, required: true, min: 0, max: 100 },
  mentorEmail: { type: String, required: false, lowercase: true, trim: true },
  classTeacherEmail: { type: String, required: false, lowercase: true, trim: true },
  parentPhone: { type: String },
  financialScore: { type: Number },
  studyHours: { type: Number },
  previousYearBacklogs: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
