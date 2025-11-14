import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Users from './pages/Users';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/users" element={<Users />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/mentor" element={<MentorDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
