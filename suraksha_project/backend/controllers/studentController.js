const Student = require('../models/Student');

async function getStudents(req, res) {
  try {
    const items = await Student.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
}

async function createStudent(req, res) {
  try {
    const { name, email, usn, cgpa, attendance, mentorEmail, classTeacherEmail } = req.body;
    if (!name || !email || !usn || cgpa === undefined || attendance === undefined) {
      return res.status(400).json({ success: false, message: 'name, email, usn, cgpa, attendance are required' });
    }
    const item = await Student.create({ name, email, usn, cgpa, attendance, mentorEmail, classTeacherEmail });
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ success: false, message: 'Email or USN already exists' });
    return res.status(500).json({ success: false, message: 'Failed to create student' });
  }
}

async function getStudentByEmail(req, res) {
  try {
    const { email } = req.params;
    const item = await Student.findOne({ email });
    if (!item) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student' });
  }
}

async function updateStudent(req, res) {
  try {
    const { email } = req.params;
    const update = req.body || {};
    const item = await Student.findOneAndUpdate({ email }, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update student' });
  }
}

// Bulk add students: accepts array of student objects
async function bulkAdd(req, res) {
  try {
    const { students } = req.body; // [{name,email,usn,cgpa,attendance,mentorEmail,classTeacherEmail}, ...]
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'students array is required' });
    }
    const result = await Student.insertMany(students, { ordered: false });
    return res.status(201).json({ success: true, inserted: result.length });
  } catch (e) {
    // insertMany may throw for duplicates; still return number inserted
    const inserted = e?.result?.result?.nInserted || 0;
    return res.status(207).json({ success: true, inserted, message: 'Bulk add completed with some errors (likely duplicates)' });
  }
}

module.exports = { getStudents, createStudent, getStudentByEmail, updateStudent, bulkAdd };
