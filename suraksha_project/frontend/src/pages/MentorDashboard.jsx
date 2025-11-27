import React, { useMemo, useState } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import StudentInfoCard from '../components/StudentInfoCard';
import '../components/StudentInfoCard.css';
import './MentorDashboard.css';
import axios from 'axios';

export default function MentorDashboard() {
  const [resource, setResource] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const mentorEmail = localStorage.getItem('email') || '';
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState({});
  const [viewItem, setViewItem] = useState(null);
  const [messageItem, setMessageItem] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [aiData, setAiData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloading, setDownloading] = useState(false);

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
          resp = await api.get('/api/mentor/students', { params: { email: mentorEmail } });
        } catch (e1) {
          try {
            resp = await api.get('/api/mentors/students', { params: { email: mentorEmail } });
          } catch (e2) {
            resp = await api.get('/api/teacher/students');
          }
        }
        setStudents(resp.data || []);
      } catch (err) {
        setError('Failed to load students');
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
      setError('Failed to send intervention');
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

  // AI suggestions with loading state and error handling
  const handleAiSuggestions = async (student) => {
    try {
      setSelectedStudent(student);
      setLoadingAi(true);
      setError('');
      setAiData(null);
      setShowModal(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const payload = {
        attendance: parseFloat(student.attendance || student.Attendance || 0),
        cgpa: parseFloat(student.cgpa || student.CGPA || 0),
        financial_score: parseFloat(student.financial_score || student.financialScore || 0),
        study_hours: parseFloat(student.study_hours || student.studyHours || 0),
        previous_year_backlogs: parseInt(student.previous_year_backlogs || student.previousYearBacklogs || 0)
      };

      // Add a small delay to show loading state (better UX)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await api.post('/api/ai/predict', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data) {
        throw new Error('No data received from the server');
      }

      // Ensure tips is an array and has at least one item
      const tips = Array.isArray(response.data.tips) && response.data.tips.length > 0 
        ? response.data.tips 
        : [
            'Monitor attendance and provide regular feedback.',
            'Schedule one-on-one sessions to understand challenges.',
            'Recommend additional study resources or tutoring.'
          ];

      setAiData({
        ...response.data,
        risk: response.data.risk || 'Moderate',
        score: response.data.score || 5,
        tips: tips
      });

    } catch (err) {
      console.error('AI Suggestion Error:', err);
      setError("AI Suggestion Failed: " + (err.response?.data?.message || err.message || 'Please try again later.'));
      
      // Set default data on error to ensure UI consistency
      setAiData({
        risk: 'Moderate',
        score: 5,
        tips: [
          'Monitor attendance and provide regular feedback.',
          'Schedule one-on-one sessions to understand challenges.',
          'Recommend additional study resources or tutoring.'
        ]
      });
    } finally {
      setLoadingAi(false);
    }
  };

  // 🧠 FIXED — PDF download with token
  const handleDownloadReport = async (student) => {
  try {
    setDownloading(true);

    const token = localStorage.getItem("token");

    const response = await axios.post(
      "http://localhost:5000/api/ai/download-report", // 👈 FULL URL (bypass proxy)
      { student },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${student.usn || "student"}_report.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.log(err);
    setError("Failed to download report");
  } finally {
    setDownloading(false);
  }
};


  const counseling = async (s) => {
    try {
      await api.post('/api/mentor/intervention', {
        studentEmail: s.email,
        mentorEmail,
        message: `Counseling recommended for ${s.name} (${s.usn}).`
      });
      setStatus('Counseling note sent');
    } catch (err) {
      setError('Failed to send counseling note');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAiData(null);
    setSelectedStudent(null);
  };

  return (
    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
      <h3 style={{ marginTop: 0 }}>Mentor Dashboard</h3>
      <div className="dashboard-layout">
        
        {/* Sidebar */}
        <aside className="glass-card sidebar">
          <Link className="side-link" to="/mentor"><span className="icon">🏠</span>Home</Link>
          <Link className="side-link" to="/mentor"><span className="icon">✉️</span>Messages</Link>
          <Link className="side-link" to="/profile"><span className="icon">👤</span>Profile</Link>
        </aside>

        {/* Main Content */}
        <section>

          {/* Resource Sender */}
          <div className="glass-card">
            <p>Send a resource/message to your assigned students.</p>
            <form onSubmit={onSubmit} className="form-col">
              <input type="text" value={mentorEmail} readOnly />
              <input type="text" placeholder="Resource link or message"
                value={resource} onChange={(e) => setResource(e.target.value)} />
              <button className="btn" type="submit">Send</button>
              {status && <p className="success">{status}</p>}
              {error && <p className="error">{error}</p>}
            </form>
          </div>

          {/* High Risk Students */}
          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4>⚠️ High Risk Students</h4>

            {highRisk.length === 0 ? <p>No high risk students</p> : (
              <ul className="list">
                {highRisk.map((s) => (
                  <li key={s._id} className="list-item">

                    <div className="student-info">
                      <b>{s.name}</b> — {s.usn}
                      <div>{s.email}</div>
                      <div>CGPA {s.cgpa} • Attendance {s.attendance}%</div>
                      <span className="badge" style={{ background: getRiskColor('High') }}>High</span>
                    </div>

                    <div style={{ minWidth: 320 }}>
                      <input className="intervention-input"
                        placeholder="Intervention / message"
                        value={messages[s.email] || ''}
                        onChange={(e) =>
                          setMessages((m) => ({ ...m, [s.email]: e.target.value }))
                        } />

                      <div className="student-actions">

                        <button className="btn" onClick={() => sendIntervention(s.email)}>💬</button>
                        <button className="btn" onClick={() => setMessageItem(s)}>📩</button>
                        <button className="btn" onClick={() => setViewItem(s)}>📘</button>
                        <button className="btn" onClick={() => alert('Marks module coming soon')}>📈</button>
                        <button className="btn" onClick={() => counseling(s)}>🧑‍⚕️</button>

                        <button
                          onClick={() => handleAiSuggestions(s)}
                          className="btn-ai"
                          disabled={loadingAi && selectedStudent?.email === s.email}
                        >
                          {loadingAi && selectedStudent?.email === s.email ? '🤔' : '🤖 AI'}
                        </button>

                      </div>
                    </div>

                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Other Students */}
          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4>Assigned Students</h4>

            {others.length === 0 ? <p>No students assigned</p> : (
              <ul className="list">
                {others.map((s) => {
                  const level = getRiskLevel(s);
                  return (
                    <li key={s._id} className="list-item">

                      <div>
                        <b>{s.name}</b> — {s.usn}
                        <div>{s.email}</div>
                        <div>CGPA {s.cgpa} • Attendance {s.attendance}%</div>
                        <span className="badge" style={{ background: getRiskColor(level) }}>
                          {level}
                        </span>
                      </div>

                      <div style={{ minWidth: 320 }}>
                        <input className="intervention-input"
                          placeholder="Intervention / message"
                          value={messages[s.email] || ''}
                          onChange={(e) =>
                            setMessages((m) => ({ ...m, [s.email]: e.target.value }))
                          } />

                        <div className="student-actions">

                          <button className="btn" onClick={() => sendIntervention(s.email)}>💬</button>
                          <button className="btn" onClick={() => setMessageItem(s)}>📩</button>
                          <button className="btn" onClick={() => setViewItem(s)}>📘</button>
                          <button className="btn" onClick={() => alert('Marks coming soon')}>📈</button>
                          <button className="btn" onClick={() => counseling(s)}>🧑‍⚕️</button>

                          <button
                            onClick={() => handleAiSuggestions(s)}
                            className="btn-ai"
                            disabled={loadingAi && selectedStudent?.email === s.email}
                          >
                            {loadingAi && selectedStudent?.email === s.email ? '🤔' : '🤖 AI'}
                          </button>

                        </div>
                      </div>

                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Student Info Modal */}
          {viewItem && (
            <StudentInfoCard student={viewItem} onClose={() => setViewItem(null)} />
          )}

          {/* AI Suggestions Modal with Enhanced UI */}
          <AnimatePresence>
            {showModal && (
              <div className="modal-backdrop" onClick={closeModal}>
                <motion.div
                  className="modal-ai"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <div className="modal-header">
                    <h3>
                      {loadingAi ? 'Analyzing Student Data' : 
                       `AI Recommendations — ${selectedStudent?.name || 'Student'}`}
                    </h3>
                    <button 
                      onClick={closeModal}
                      aria-label="Close modal"
                      disabled={loadingAi}
                    >
                      ✖
                    </button>
                  </div>

                  <div className="modal-content">
                    {loadingAi ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Analyzing student data and generating recommendations...</p>
                      </div>
                    ) : error ? (
                      <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <p>{error}</p>
                        <small>Displaying sample recommendations</small>
                      </div>
                    ) : null}

                    {aiData && selectedStudent && (
                      <>
                        <div className="student-summary">
                          <div className="student-avatar">
                            {selectedStudent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{selectedStudent.name}</h4>
                            <p className="muted">{selectedStudent.usn || selectedStudent.email}</p>
                          </div>
                        </div>

                        <div className="risk-assessment">
                          <div className="risk-row">
                            <div>
                              <strong>Risk Assessment</strong>
                              <p className="muted">Based on academic and behavioral data</p>
                            </div>
                            <span className={`risk-badge ${aiData.risk?.toLowerCase() || 'moderate'}`}>
                              {aiData.risk || 'Moderate'}
                            </span>
                          </div>

                          <div className="risk-meter">
                            <div className="risk-labels">
                              <span>Low Risk</span>
                              <span>High Risk</span>
                            </div>
                            <div className="risk-bar">
                              <div 
                                className={`risk-fill ${aiData.risk?.toLowerCase() || 'moderate'}`}
                                style={{ width: `${(aiData.score || 5) * 10}%` }}
                              ></div>
                            </div>
                            <div className="risk-score">
                              Risk Score: <strong>{aiData.score || 5}/10</strong>
                            </div>
                          </div>
                        </div>

                        <div className="recommendations">
                          <h4>
                            <span className="icon">💡</span>
                            Recommended Actions
                          </h4>
                          <ol>
                            {(aiData.tips || []).map((tip, i) => (
                              <motion.li 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                {tip}
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                      </>
                    )}
                  </div>

                  {aiData && !loadingAi && (
                    <div className="modal-footer">
                      <button
                        className="btn-download"
                        onClick={() => handleDownloadReport(selectedStudent)}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <>
                            <span className="spinner"></span>
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <span className="icon">📄</span>
                            Download Full Report
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Message Modal */}
          {messageItem && (
            <div className="modal-backdrop" onClick={() => setMessageItem(null)}>
              <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <h4>Send Message</h4>
                <p>To: {messageItem.name} ({messageItem.email})</p>

                <textarea rows={4}
                  placeholder="Write a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)} />

                <div className="modal-footer">
                  <button className="btn"
                    onClick={async () => {
                      await api.post('/api/mentor/intervention', {
                        studentEmail: messageItem.email,
                        mentorEmail,
                        message: messageText || 'Message'
                      });
                      setMessageItem(null);
                      setMessageText('');
                      setStatus('Message sent');
                    }}>
                    Send
                  </button>

                  <button className="btn" onClick={() => setMessageItem(null)}>
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          )}

        </section>
      </div>
    </motion.div>
  );
}
