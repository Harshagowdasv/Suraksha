const Mentor = require('../models/Mentor');
const Student = require('../models/Student');

async function getMentors(req, res) {
  try {
    const items = await Mentor.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch mentors' });
  }
}

async function createMentor(req, res) {
  try {
    const { name, email, assignedStudents = [], resources = [] } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }
    const item = await Mentor.create({ name, email, assignedStudents, resources });
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    return res.status(500).json({ success: false, message: 'Failed to create mentor' });
  }
}

async function getMentorByEmail(req, res) {
  try {
    const { email } = req.params;
    const item = await Mentor.findOne({ email });
    if (!item) return res.status(404).json({ success: false, message: 'Mentor not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch mentor' });
  }
}

async function updateMentor(req, res) {
  try {
    const { email } = req.params;
    const update = req.body || {};
    const item = await Mentor.findOneAndUpdate({ email }, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Mentor not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update mentor' });
  }
}

// POST /api/mentors/sendResource { mentorEmail, resource }
async function sendResource(req, res) {
  try {
    const { mentorEmail, resource } = req.body;
    if (!mentorEmail || !resource) return res.status(400).json({ success: false, message: 'mentorEmail and resource are required' });
    const mentor = await Mentor.findOne({ email: mentorEmail });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    mentor.resources.push(resource);
    await mentor.save();
    return res.status(200).json({ success: true, data: mentor });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to send resource' });
  }
}

// GET /api/mentors/resourcesForStudent?studentEmail=...
async function resourcesForStudent(req, res) {
  try {
    const { studentEmail } = req.query;
    if (!studentEmail) return res.status(400).json({ success: false, message: 'studentEmail is required' });
    const student = await Student.findOne({ email: studentEmail });
    if (!student || !student.mentorEmail) return res.status(200).json({ success: true, data: [] });
    const mentor = await Mentor.findOne({ email: student.mentorEmail });
    return res.status(200).json({ success: true, data: mentor ? mentor.resources : [] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
}

module.exports = { getMentors, createMentor, getMentorByEmail, updateMentor, sendResource, resourcesForStudent };
