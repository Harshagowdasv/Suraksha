require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Suraksha API is running' });
});
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/students', studentRoutes);
// also mount singular paths for compatibility with new UI endpoints
app.use('/api/teacher', teacherRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Server Error';
  res.status(status).json({ success: false, message });
});

// Start server after DB connection
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
