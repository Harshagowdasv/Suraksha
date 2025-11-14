import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const isAuthed = !!localStorage.getItem('token');

  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand">Suraksha</div>
      <nav className="nav-actions">
        {!isAuthed && (
          <>
            <Link to="/login" className="link" aria-current={location.pathname === '/login'}>Login</Link>
            <Link to="/register" className="link" aria-current={location.pathname === '/register'}>Register</Link>
          </>
        )}
        <Link to="/users" className="link" aria-current={location.pathname === '/users'}>Users</Link>
        {role === 'teacher' && <Link to="/teacher" className="link">Teacher</Link>}
        {role === 'mentor' && <Link to="/mentor" className="link">Mentor</Link>}
        {role === 'student' && <Link to="/student" className="link">Student</Link>}
        {isAuthed && <button className="btn" onClick={onLogout}>Logout</button>}
      </nav>
    </header>
  );
}
