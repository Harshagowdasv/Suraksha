import React, { useMemo, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function MentorDashboard() {
  const [resource, setResource] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const mentorEmail = localStorage.getItem('email') || '';
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState({}); // map studentEmail -> message
  const [viewItem, setViewItem] = useState(null);
  const [messageItem, setMessageItem] = useState(null);
  const [messageText, setMessageText] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      const res = await api.post('/api/mentors/sendResource', { mentorEmail, resource });
      setStatus(`Resource sent. Total resources: ${res.data.data?.resources?.length || 0}`);
      setResource('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send');
    }
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        let resp;
        try {
          if (mentorEmail) {
            resp = await api.get('/api/mentor/students', { params: { email: mentorEmail } });
          } else {
            resp = await api.get('/api/mentor/students');
          }
        } catch (e1) {
          try {
            if (mentorEmail) {
              resp = await api.get('/api/mentors/students', { params: { email: mentorEmail } });
            } else {
              resp = await api.get('/api/mentors/students');
            }
          } catch (e2) {
            // fallback to teacher listing to guarantee data is visible
            resp = await api.get('/api/teacher/students');
          }
        }
        setStudents(resp.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load students');
      }
    };
    load();
  }, [mentorEmail]);

  const sendIntervention = async (studentEmail) => {
    try {
      const message = messages[studentEmail] || '';
      if (!message) return setError('Please enter a message');
      await api.post('/api/mentor/intervention', { studentEmail, mentorEmail, message });
      setStatus('Intervention sent');
      setMessages((m) => ({ ...m, [studentEmail]: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send intervention');
    }
  };

  const getRiskLevel = (s) => {
    let risk = 0;
    if ((s.attendance ?? 100) < 75) risk += 2;
    if ((s.cgpa ?? 10) < 6) risk += 2;
    if ((s.financialScore ?? 100) < 50) risk += 1;
    if ((s.studyHours ?? 10) < 2) risk += 2;
    if ((s.previousYearBacklogs ?? 0) > 2) risk += 2;
    if (risk >= 6) return 'High';
    if (risk >= 3) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (level) => {
    if (level === 'High') return '#f87171';
    if (level === 'Moderate') return '#facc15';
    return '#4ade80';
  };

  const highRisk = useMemo(() => students.filter((s) => getRiskLevel(s) === 'High'), [students]);
  const others = useMemo(() => students.filter((s) => getRiskLevel(s) !== 'High'), [students]);

  const counseling = async (s) => {
    try {
      await api.post('/api/mentor/intervention', { studentEmail: s.email, mentorEmail, message: `Counseling recommended for ${s.name} (${s.usn}).` });
      setStatus('Counseling note sent');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send counseling note');
    }
  };

  return (
    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
      <h3 style={{ marginTop: 0 }}>Mentor Dashboard</h3>
      <div className="dashboard-layout">
        <aside className="glass-card sidebar">
          <Link className="side-link" to="/mentor"><span className="icon">🏠</span>Home</Link>
          <Link className="side-link" to="/mentor"><span className="icon">✉️</span>Messages</Link>
          <Link className="side-link" to="/profile"><span className="icon">👤</span>Profile</Link>
        </aside>
        <section>
          <div className="glass-card">
            <p>Send a resource/message to your assigned students.</p>
            <form onSubmit={onSubmit} className="form-col">
              <input type="text" value={mentorEmail} readOnly />
              <input type="text" placeholder="Resource link or message" value={resource} onChange={(e) => setResource(e.target.value)} />
              <button className="btn" type="submit">Send</button>
              {status && <p className="success">{status}</p>}
              {error && <p className="error">{error}</p>}
            </form>
          </div>

          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4 style={{ marginTop: 0 }}>⚠️ High Risk Students</h4>
            {highRisk.length === 0 ? (
              <p>No high risk students</p>
            ) : (
              <ul className="list">
                {highRisk.map((s) => (
                  <li key={s._id} className="list-item" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <div clas="text-black">
                      <div><b>{s.name}</b> — {s.usn}</div>
                      <div className="muted">{s.email}</div>
                      <div className="muted">CGPA {s.cgpa} • Attendance {s.attendance}%</div>
                      <div style={{ marginTop: 4 }}>
                        <span className="badge" style={{ background: getRiskColor('High') }}>High</span>
                      </div>
                    </div>
                    <div style={{ minWidth: 320 }}>
                      <input
                        placeholder="Intervention / message"
                        value={messages[s.email] || ''}
                        onChange={(e) => setMessages((m) => ({ ...m, [s.email]: e.target.value }))}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button className="btn" onClick={() => sendIntervention(s.email)}>💬 Intervention</button>
                        <button className="btn" onClick={() => setMessageItem(s)}>📩 Message</button>
                        <button className="btn" onClick={() => setViewItem(s)}>📘 Info</button>
                        <button className="btn" onClick={() => alert('Marks module in progress')}>📈 Marks</button>
                        <button className="btn" onClick={() => counseling(s)}>🧑‍⚕️ Counseling</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4 style={{ marginTop: 0 }}>Assigned Students</h4>
            {others.length === 0 ? (
              <p>No students assigned</p>
            ) : (
              <ul className="list">
                {others.map((s) => {
                  const level = getRiskLevel(s);
                  return (
                    <li key={s._id} className="list-item" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div><b>{s.name}</b> — {s.usn}</div>
                        <div className="muted">{s.email}</div>
                        <div className="muted">CGPA {s.cgpa} • Attendance {s.attendance}%</div>
                        <div style={{ marginTop: 4 }}>
                          <span className="badge" style={{ background: getRiskColor(level) }}>{level}</span>
                        </div>
                      </div>
                      <div style={{ minWidth: 320 }}>
                        <input
                          placeholder="Intervention / message"
                          value={messages[s.email] || ''}
                          onChange={(e) => setMessages((m) => ({ ...m, [s.email]: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button className="btn" onClick={() => sendIntervention(s.email)}>💬 Intervention</button>
                          <button className="btn" onClick={() => setMessageItem(s)}>📩 Message</button>
                          <button className="btn" onClick={() => setViewItem(s)}>📘 Info</button>
                          <button className="btn" onClick={() => alert('Marks module in progress')}>📈 Marks</button>
                          <button className="btn" onClick={() => counseling(s)}>🧑‍⚕️ Counseling</button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {viewItem && (
            <div className="modal-backdrop" onClick={() => setViewItem(null)}>
              <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <h4 style={{ marginTop: 0 }}>Student Info</h4>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(viewItem, null, 2)}</pre>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => setViewItem(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {messageItem && (
            <div className="modal-backdrop" onClick={() => setMessageItem(null)}>
              <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <h4 style={{ marginTop: 0 }}>Send Message</h4>
                <p style={{ marginTop: -6 }}>To: {messageItem.name} ({messageItem.email})</p>
                <textarea rows={4} placeholder="Write a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={async () => { await api.post('/api/mentor/intervention', { studentEmail: messageItem.email, mentorEmail, message: messageText || 'Message' }); setMessageItem(null); setMessageText(''); setStatus('Message sent'); }}>Send</button>
                  <button className="btn" onClick={() => setMessageItem(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
