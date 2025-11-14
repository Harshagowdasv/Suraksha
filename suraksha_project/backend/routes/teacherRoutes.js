const express = require('express');
const { getTeachers, createTeacher, getTeacherByEmail, updateTeacher } = require('../controllers/teacherController');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');
const Intervention = require('../models/Intervention');
const AuthUser = require('../models/AuthUser');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getTeachers)
  .post(createTeacher);

// CSV Upload: POST /api/teachers/upload (also mounted at /api/teacher/upload if server mounts singular path to this router)
const uploadDir = path.join(process.cwd(), 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
const upload = multer({ dest: uploadDir });

// DELETE /api/teacher/student/:id - delete student by id
router.delete('/student/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Student deleted' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to delete student' });
  }
});

// PUT /api/teacher/student/:id - update student by id
router.put('/student/:id', async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to update student' });
  }
});
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const jsonArray = await csv().fromFile(req.file.path);
    const n = (v) => {
      const num = Number((v ?? '').toString().trim());
      return Number.isFinite(num) ? num : 0;
    };
    const s = (v) => (v ?? '').toString().trim();
    const docs = jsonArray.map((row) => ({
      usn: s(row.usn || row.USN),
      name: s(row.name || row.Name),
      email: s(row.email || row.Email).toLowerCase(),
      attendance: n(row.attendance || row.Attendance),
      cgpa: n(row.cgpa || row.CGPA),
      parentPhone: s(row.parent_phone_number || row.parentPhone || row.ParentPhone),
      financialScore: n(row.financial_score || row.financialScore),
      studyHours: n(row.study_hours || row.studyHours),
      previousYearBacklogs: n(row.previous_year_backlogs || row.previousYearBacklogs),
      mentorEmail: s(row.mentorEmail || row.MentorEmail || row['mentor_email'] || row['mentor email']),
      classTeacherEmail: s(row.classTeacherEmail),
    })).filter(sv => sv.name && sv.email && sv.usn);

    const result = await Student.insertMany(docs, { ordered: false });

    // Auto-create student auth accounts (email=username, password name@123)
    const toCreate = [];
    for (const sdoc of result) {
      const email = (sdoc.email || '').toLowerCase();
      if (!email) continue;
      const exists = await AuthUser.findOne({ email });
      if (!exists) {
        const nameStr = (sdoc.name || '').toString().trim().toLowerCase().replace(/\s+/g, '');
        const rawPassword = `${nameStr}@123`;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(rawPassword, salt);
        toCreate.push({ name: sdoc.name, email, role: 'student', password: hash });
      }
    }
    if (toCreate.length) {
      await AuthUser.insertMany(toCreate, { ordered: false });
    }
    // cleanup temp file
    fs.unlink(req.file.path, () => {});
    return res.json({ success: true, inserted: result.length, items: result });
  } catch (error) {
    // best-effort cleanup
    if (req.file) fs.unlink(req.file.path, () => {});
    const inserted = error?.result?.result?.nInserted || 0;
    return res.status(207).json({ success: true, inserted, message: 'Upload processed with some errors (likely duplicates)' });
  }
});

// GET /api/teacher/students - list students (optional filter by classTeacherEmail)
router.get('/students', async (req, res) => {
  try {
    const { classTeacherEmail } = req.query;
    const query = classTeacherEmail ? { classTeacherEmail } : {};
    const items = await Student.find(query).sort({ name: 1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// DELETE /api/teacher/students - bulk delete all students
router.delete('/students', async (req, res) => {
  try {
    const result = await Student.deleteMany({});
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to delete all students' });
  }
});

// PUT /api/teacher/students/mentor - set mentorEmail for all students
router.put('/students/mentor', async (req, res) => {
  try {
    const { mentorEmail } = req.body;
    if (!mentorEmail) return res.status(400).json({ success: false, message: 'mentorEmail is required' });
    const email = (mentorEmail || '').toString().trim().toLowerCase();
    const r = await Student.updateMany({}, { $set: { mentorEmail: email } });
    return res.json({ success: true, matched: r.matchedCount ?? r.n, modified: r.modifiedCount ?? r.nModified, mentorEmail: email });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to set mentor for all students' });
  }
});

// POST /api/teacher/students/notifyAll - create interventions for all students with mentorEmail
router.post('/students/notifyAll', async (req, res) => {
  try {
    const students = await Student.find({ mentorEmail: { $exists: true, $ne: '' } });
    const ops = students.map((s) => ({
      insertOne: {
        document: {
          studentEmail: s.email,
          mentorEmail: s.mentorEmail,
          message: `Please review student ${s.name} (${s.usn}).`,
          acknowledged: false,
          createdAt: new Date(),
        },
      }
    }));
    if (ops.length === 0) return res.json({ success: true, created: 0 });
    const result = await Intervention.bulkWrite(ops);
    return res.json({ success: true, created: result.insertedCount ?? ops.length });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to notify mentors for all students' });
  }
});

// Keep parameterized route LAST to avoid shadowing specific paths like /students
router.route('/:email')
  .get(getTeacherByEmail)
  .put(updateTeacher);

module.exports = router;
