import React from 'react';
import { motion } from 'framer-motion';

const StudentInfoCard = ({ student, onClose }) => {
  console.log('Student data:', student);
  const getRiskLevel = (s) => {
    let risk = 0;
    if ((s.attendance ?? 100) < 75) risk += 2;
    if ((s.cgpa ?? 10) < 6) risk += 2;
    if ((s.financialScore ?? 100) < 50) risk += 1;
    if ((s.studyHours ?? 10) < 2) risk += 2;
    if ((s.previousYearBacklogs ?? 0) > 2) risk += 2;
    if (risk >= 6) return { level: 'High', color: '#ef4444' };
    if (risk >= 3) return { level: 'Moderate', color: '#f59e0b' };
    return { level: 'Low', color: '#10b981' };
  };

  const risk = getRiskLevel(student);
  // Safely access student properties with fallbacks using the actual data structure
  const name = student?.name || 'Unknown Student';
  const email = student?.email || 'No email';
  const usn = student?.usn || 'N/A';
  const parentPhone = student?.parentPhone || 'Not provided';
  const mentorEmail = student?.mentorEmail || 'Not assigned';
  const classTeacherEmail = student?.classTeacherEmail || 'Not assigned';

  const stats = [
    { 
      label: 'CGPA', 
      value: student?.cgpa !== undefined ? student.cgpa : 'N/A', 
      icon: '📊' 
    },
    { 
      label: 'Attendance', 
      value: student?.attendance !== undefined ? `${student.attendance}%` : 'N/A', 
      icon: '📅' 
    },
    { 
      label: 'Study Hours', 
      value: student?.studyHours !== undefined ? `${student.studyHours} hrs` : 'N/A', 
      icon: '⏱️' 
    },
    { 
      label: 'Backlogs', 
      value: student?.previousYearBacklogs !== undefined ? student.previousYearBacklogs : '0',
      icon: '⚠️' 
    },
  ];

  return (
    <motion.div 
      className="modal-backdrop" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal glass-card" 
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="student-profile">
          <div className="student-header">
            <div className="student-avatar">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="student-title">
              <h3>{name}</h3>
              <div className="student-meta">
                <span>{usn}</span>
                <span className="divider">•</span>
                <span>{email}</span>
              </div>
              <div className="student-meta">
                <span>Parent: {parentPhone}</span>
                <span className="divider">•</span>
                <span>Mentor: {mentorEmail}</span>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <div className="risk-indicator" style={{ backgroundColor: `${risk.color}20`, borderColor: risk.color }}>
            <span className="risk-dot" style={{ backgroundColor: risk.color }}></span>
            {risk.level} Risk
          </div>

          <div className="student-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="student-details">
            <div className="detail-row">
              <span className="detail-label">Student ID</span>
              <span className="detail-value">{student?._id || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created</span>
              <span className="detail-value">
                {student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">
                {student?.updatedAt ? new Date(student.updatedAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Financial Score</span>
              <span className="detail-value">
                {student?.financialScore !== undefined ? `${student.financialScore}%` : 'N/A'}
              </span>
            </div>
          </div>

          {student.address && (
            <div className="student-section">
              <h4>Address</h4>
              <p className="address">{student.address}</p>
            </div>
          )}

          {student.notes && (
            <div className="student-section">
              <h4>Notes</h4>
              <p className="notes">{student.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentInfoCard;
