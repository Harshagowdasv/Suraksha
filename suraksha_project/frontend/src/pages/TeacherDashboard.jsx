import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './TeacherDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TeacherDashboard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null); // object or null
  const [viewItem, setViewItem] = useState(null);
  const [messageItem, setMessageItem] = useState(null); // student for message
  const [messageText, setMessageText] = useState('');
  const [bulkMentorEmail, setBulkMentorEmail] = useState('');

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setResult('');
    setError('');
    setRows([]);
  };

  const setMentorForAll = async () => {
    try {
      const body = { mentorEmail: bulkMentorEmail };
      try {
        await api.put('/api/teacher/students/mentor', body);
      } catch (e) {
        await api.put('/api/teachers/students/mentor', body);
      }
      setResult(`Mentor set for all: ${bulkMentorEmail}`);
      await fetchStudents();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to set mentor for all');
    }
  };

  const notifyAll = async () => {
    try {
      try {
        await api.post('/api/teacher/students/notifyAll');
      } catch (e) {
        await api.post('/api/teachers/students/notifyAll');
      }
      setResult('Notified mentors for all students');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to notify all');
    }
  };

  const uploadCSV = async () => {
    try {
      if (!file) return setError('Please choose a CSV file');
      setError('');
      const form = new FormData();
      form.append('file', file);
      let resp;
      try {
        resp = await api.post('/api/teacher/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (e) {
        // fallback to plural mount
        resp = await api.post('/api/teachers/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setResult(`Inserted: ${resp.data.inserted}`);
      setRows(resp.data.items || []);
      await fetchStudents();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Upload failed');
    }
  };

  const notifyMentor = async (studentId) => {
    try {
      await api.post(`/api/mentor/notify/${studentId}`);
      setResult('Mentor has been notified for review.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to notify mentor');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await api.get('/api/teacher/students');
      } catch (e) {
        // fallback to plural mount
        res = await api.get('/api/teachers/students');
      }
      setStudents(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const clearAllStudents = async () => {
    if (!window.confirm('Delete ALL students from the database?')) return;
    try {
      try {
        await api.delete('/api/teacher/students');
      } catch (e) {
        await api.delete('/api/teachers/students');
      }
      setResult('All students deleted');
      setRows([]);
      await fetchStudents();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete all students');
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

  const riskCounts = useMemo(() => {
    const high = students.filter((s) => getRiskLevel(s) === 'High').length;
    const moderate = students.filter((s) => getRiskLevel(s) === 'Moderate').length;
    const low = students.filter((s) => getRiskLevel(s) === 'Low').length;
    return { high, moderate, low };
  }, [students]);

  const pieData = useMemo(() => ({
    labels: ['High', 'Moderate', 'Low'],
    datasets: [{ data: [riskCounts.high, riskCounts.moderate, riskCounts.low], backgroundColor: ['#f87171', '#facc15', '#4ade80'], borderColor: 'rgba(255,255,255,0.35)' }]
  }), [riskCounts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.delete(`/api/teacher/student/${id}`);
      await fetchStudents();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const { _id, ...payload } = editItem;
      const res = await api.put(`/api/teacher/student/${_id}`, payload);
      setEditItem(null);
      await fetchStudents();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update');
    }
  };

  const sendIntervention = async (s, text) => {
    try {
      if (!s.mentorEmail) return setError('No mentorEmail set for this student');
      await api.post('/api/mentor/intervention', { studentEmail: s.email, mentorEmail: s.mentorEmail, message: text });
      setResult('Intervention sent');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to send intervention');
    }
  };

  return (
    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
      <h3 style={{ marginTop: 0 }}>Teacher Dashboard</h3>
      <div className="dashboard-layout">
        <aside className="glass-card sidebar">
          <Link className="side-link" to="/teacher"><span className="icon">🏠</span>Home</Link>
          <Link className="side-link" to="/teacher"><span className="icon">📥</span>Bulk Upload</Link>
          <Link className="side-link" to="/profile"><span className="icon">👤</span>Profile</Link>
        </aside>
        <section>
          <div className="glass-card">
            <p>Upload CSV of students with columns (example): <b>usn,name,email,phonenumber,parent_phone_number,attendance,cgpa,financial_score,study_hours,previous_year_backlogs</b></p>
            <input type="file" accept=".csv" onChange={onFileChange} />
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={uploadCSV}>Upload</button>
              <button className="btn" style={{ marginLeft: 8 }} onClick={() => setShowAnalytics((v) => !v)}>
                {showAnalytics ? 'Hide Insights' : 'View Insights'}
              </button>
              <button className="btn" style={{ marginLeft: 8 }} onClick={clearAllStudents}>
                Clear All Students
              </button>
            </div>
            {result && <p className="success" style={{ marginTop: 8 }}>{result}</p>}
            {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
          </div>

          {showAnalytics && (
            <div style={{ marginTop: 12 }}>
              <AnalyticsDashboard />
            </div>
          )}

          {rows.length > 0 && (
            <div className="glass-card" style={{ marginTop: 12, overflowX: 'auto' }}>
              <h4 style={{ marginTop: 0 }}>Uploaded Students</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>USN</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>CGPA</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Attendance</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s._id} style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                      <td style={{ padding: 8 }}>{s.usn}</td>
                      <td style={{ padding: 8 }}>{s.name}</td>
                      <td style={{ padding: 8 }}>{s.email}</td>
                      <td style={{ padding: 8 }}>{s.cgpa}</td>
                      <td style={{ padding: 8 }}>{s.attendance}</td>
                      <td style={{ padding: 8 }}>
                        <button className="btn" onClick={() => notifyMentor(s._id)}>Send to Mentor</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="glass-card" style={{ marginTop: 12 }}>
            <h4 style={{ marginTop: 0 }}>Overall Class Risk</h4>
            <div style={{ maxWidth: 420 }}>
              <Pie data={pieData} />
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: 12, overflowX: 'auto' }}>
            <h4 style={{ marginTop: 0 }}>All Students</h4>
            <div className="toggle-row" style={{ marginBottom: 10 }}>
              <input style={{ minWidth: 260 }} placeholder="Set mentor email for all" value={bulkMentorEmail} onChange={(e) => setBulkMentorEmail(e.target.value)} />
              <button className="btn" onClick={setMentorForAll}>Set Mentor</button>
              <button className="btn" onClick={notifyAll}>Send All to Mentor</button>
            </div>
            {loading ? (
              <div className="spinner" />
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>USN</th>
                    <th>Attendance</th>
                    <th>CGPA</th>
                    <th>Risk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const level = getRiskLevel(s);
                    return (
                      <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.usn}</td>
                        <td>{s.attendance}</td>
                        <td>{s.cgpa}</td>
                        <td>
                          <span className="badge" style={{ background: getRiskColor(level) }}>{level}</span>
                        </td>
                        <td className="actions">
                          <button title="Edit" onClick={() => setEditItem({ ...s })}>✏️</button>
                          <button title="Delete" onClick={() => handleDelete(s._id)}>🗑️</button>
                          <button title="Intervention" onClick={() => setMessageItem(s)}>💬</button>
                          <button title="Message" onClick={() => { setMessageItem(s); setMessageText(''); }}>📩</button>
                          <button title="Info" onClick={() => setViewItem(s)}>📘</button>
                          <button title="Marks" onClick={() => alert('Marks module in progress')}>📈</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {editItem && (
            <div className="modal-backdrop" onClick={() => setEditItem(null)}>
              <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <h4 style={{ marginTop: 0 }}>Edit Student</h4>
                <div className="grid-2">
                  <input value={editItem.name || ''} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="Name" />
                  <input value={editItem.email || ''} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="Email" />
                  <input value={editItem.usn || ''} onChange={(e) => setEditItem({ ...editItem, usn: e.target.value })} placeholder="USN" />
                  <input type="number" value={editItem.attendance ?? ''} onChange={(e) => setEditItem({ ...editItem, attendance: Number(e.target.value) })} placeholder="Attendance" />
                  <input type="number" value={editItem.cgpa ?? ''} onChange={(e) => setEditItem({ ...editItem, cgpa: Number(e.target.value) })} placeholder="CGPA" />
                  <input value={editItem.parentPhone || ''} onChange={(e) => setEditItem({ ...editItem, parentPhone: e.target.value })} placeholder="Parent Phone" />
                  <input type="number" value={editItem.financialScore ?? ''} onChange={(e) => setEditItem({ ...editItem, financialScore: Number(e.target.value) })} placeholder="Financial Score" />
                  <input type="number" value={editItem.studyHours ?? ''} onChange={(e) => setEditItem({ ...editItem, studyHours: Number(e.target.value) })} placeholder="Study Hours" />
                  <input type="number" value={editItem.previousYearBacklogs ?? ''} onChange={(e) => setEditItem({ ...editItem, previousYearBacklogs: Number(e.target.value) })} placeholder="Prev Year Backlogs" />
                  <input value={editItem.mentorEmail || ''} onChange={(e) => setEditItem({ ...editItem, mentorEmail: e.target.value })} placeholder="Mentor Email" />
                  <input value={editItem.classTeacherEmail || ''} onChange={(e) => setEditItem({ ...editItem, classTeacherEmail: e.target.value })} placeholder="Class Teacher Email" />
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={handleSaveEdit}>Save</button>
                  <button className="btn" onClick={() => setEditItem(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

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
                <h4 style={{ marginTop: 0 }}>Send Intervention/Message</h4>
                <p style={{ marginTop: -6 }}>To: {messageItem.name} ({messageItem.email})</p>
                <textarea rows={4} placeholder="Write a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={async () => { await sendIntervention(messageItem, messageText); setMessageItem(null); setMessageText(''); }}>Send</button>
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
