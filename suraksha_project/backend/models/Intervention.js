const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  studentEmail: String,
  mentorEmail: String,
  message: String,
  acknowledged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Intervention', interventionSchema);
