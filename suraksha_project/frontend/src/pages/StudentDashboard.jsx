import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const email = localStorage.getItem('email') || '';
  const [student, setStudent] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setError('');
      setLoading(true);
      try {
        if (!email) return setError('No email in localStorage. Please login.');
        const s = await api.get(`/api/student/profile`, { params: { email } });
        setStudent(s.data);
        const r = await api.get(`/api/student/interventions`, { params: { email } });
        setInterventions(r.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [email]);

  const acknowledge = async (id) => {
    try {
      await api.patch(`/api/student/intervention/${id}/ack`);
      setInterventions((list) => list.map((x) => x._id === id ? { ...x, acknowledged: true } : x));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to acknowledge');
    }
  };

  return (
    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
      <h3 style={{ marginTop: 0 }}>Student Dashboard</h3>
      <div className="dashboard-layout">
        <aside className="glass-card sidebar">
          <Link className="side-link" to="/student"><span className="icon">🏠</span>Home</Link>
          <Link className="side-link" to="/student"><span className="icon">📚</span>Resources</Link>
          <Link className="side-link" to="/profile"><span className="icon">👤</span>Profile</Link>
        </aside>
        <section>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <div className="glass-card"><div className="spinner" /></div>
          ) : !student ? (
            <div className="glass-card"><p>No data</p></div>
          ) : (
            <div className="glass-card">
              <h4 style={{ marginTop: 0 }}>{student.name}</h4>
              <p>Email: {student.email}</p>
              <p>USN: {student.usn}</p>
              <p>CGPA: {student.cgpa}</p>
              <p>Attendance: {student.attendance}%</p>
              <p>Mentor: {student.mentorEmail || '—'}</p>
              <p>Class Teacher: {student.classTeacherEmail || '—'}</p>
            </div>
          )}

          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4 style={{ marginTop: 0 }}>Mentor Updates</h4>
            {interventions.length === 0 ? (
              <p>No messages yet</p>
            ) : (
              <ul className="list">
                {interventions.map((iv) => (
                  <li key={iv._id} className="list-item" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div><b>From:</b> {iv.mentorEmail}</div>
                      <div style={{ marginTop: 4 }}>{iv.message}</div>
                      <div className="muted" style={{ marginTop: 4 }}>{new Date(iv.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      {iv.acknowledged ? (
                        <span className="muted">Acknowledged</span>
                      ) : (
                        <button className="btn" onClick={() => acknowledge(iv._id)}>Acknowledge</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
