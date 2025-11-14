const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getStudents, createStudent, getStudentByEmail, updateStudent, bulkAdd } = require('../controllers/studentController');
const Intervention = require('../models/Intervention');
const Student = require('../models/Student');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/bulkAdd')
  .post(bulkAdd);

// GET /api/students/profile?email=
router.get('/profile', async (req, res) => {
  try {
    const email = req.query.email || req.user?.email;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });
    const student = await Student.findOne({ email });
    return res.json(student);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// GET /api/students/interventions?email=
router.get('/interventions', async (req, res) => {
  try {
    const email = req.query.email || req.user?.email;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });
    const items = await Intervention.find({ studentEmail: email }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch interventions' });
  }
});

// PATCH /api/students/intervention/:id/ack
router.patch('/intervention/:id/ack', async (req, res) => {
  try {
    const { id } = req.params;
    await Intervention.findByIdAndUpdate(id, { acknowledged: true });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to acknowledge intervention' });
  }
});

router.route('/:email')
  .get(getStudentByEmail)
  .put(updateStudent);

module.exports = router;
