const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getMentors, createMentor, getMentorByEmail, updateMentor, sendResource, resourcesForStudent } = require('../controllers/mentorController');
const Student = require('../models/Student');
const Intervention = require('../models/Intervention');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getMentors)
  .post(createMentor);

router.route('/sendResource')
  .post(sendResource);

router.route('/resourcesForStudent')
  .get(resourcesForStudent);

// New: GET /students?email=mentorEmail
router.get('/students', async (req, res) => {
  try {
    const mentorEmail = req.query.email || req.user?.email;
    const query = mentorEmail ? { mentorEmail } : {};
    const students = await Student.find(query);
    return res.json(students);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch mentor students' });
  }
});

// New: POST /intervention { studentEmail, mentorEmail, message }
router.post('/intervention', async (req, res) => {
  try {
    const { studentEmail, mentorEmail, message } = req.body;
    if (!studentEmail || !mentorEmail || !message) return res.status(400).json({ success: false, message: 'studentEmail, mentorEmail, message are required' });
    const intervention = await Intervention.create({ studentEmail, mentorEmail, message });
    return res.json({ success: true, intervention });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to create intervention' });
  }
});

// New: POST /notify/:studentId — teacher triggers a mentor notification
router.post('/notify/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.mentorEmail) return res.status(400).json({ success: false, message: 'Student has no mentorEmail set' });
    const message = `Please review student ${student.name} (${student.usn}).`;
    const doc = await Intervention.create({ studentEmail: student.email, mentorEmail: student.mentorEmail, message });
    return res.json({ success: true, intervention: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to notify mentor' });
  }
});

router.route('/:email')
  .get(getMentorByEmail)
  .put(updateMentor);

module.exports = router;
