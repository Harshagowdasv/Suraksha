const express = require('express');
const auth = require('../middleware/authMiddleware');
const Student = require('../models/Student');

const router = express.Router();

// Protect AI endpoints as well
router.use(auth);

// GET /api/ai/predictions
router.get('/predictions', async (req, res) => {
  try {
    const students = await Student.find();
    const predictions = students.map((s) => {
      let risk = 0;
      if ((s.attendance ?? 100) < 75) risk += 2;
      if ((s.cgpa ?? 10) < 6) risk += 2;
      if ((s.financialScore ?? 100) < 50) risk += 1;
      if ((s.studyHours ?? 10) < 2) risk += 2;
      if ((s.previousYearBacklogs ?? 0) > 2) risk += 2;

      let riskLevel = 'Low';
      if (risk >= 3 && risk < 6) riskLevel = 'Moderate';
      else if (risk >= 6) riskLevel = 'High';

      return {
        name: s.name,
        email: s.email,
        attendance: s.attendance,
        cgpa: s.cgpa,
        financialScore: s.financialScore,
        studyHours: s.studyHours,
        riskLevel,
      };
    });
    return res.json(predictions);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to compute predictions' });
  }
});

module.exports = router;
