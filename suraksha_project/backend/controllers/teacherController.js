const Teacher = require('../models/Teacher');

async function getTeachers(req, res) {
  try {
    const items = await Teacher.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
}

async function createTeacher(req, res) {
  try {
    const { name, email, subject, students = [] } = req.body;
    if (!name || !email || !subject) {
      return res.status(400).json({ success: false, message: 'name, email, subject are required' });
    }
    const item = await Teacher.create({ name, email, subject, students });
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    return res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
}

async function getTeacherByEmail(req, res) {
  try {
    const { email } = req.params;
    const item = await Teacher.findOne({ email });
    if (!item) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher' });
  }
}

async function updateTeacher(req, res) {
  try {
    const { email } = req.params;
    const update = req.body || {};
    const item = await Teacher.findOneAndUpdate({ email }, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update teacher' });
  }
}

module.exports = { getTeachers, createTeacher, getTeacherByEmail, updateTeacher };
