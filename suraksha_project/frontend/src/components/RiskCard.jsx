import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'react-feather';
import './RiskCard.css';

const RiskCard = ({ student, onUpdate }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      if (!student) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/ai/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            attendance: student.attendance,
            cgpa: student.cgpa,
            financialScore: student.financialScore,
            studyHours: student.studyHours,
            previousYearBacklogs: student.previousYearBacklogs
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch risk assessment');
        }
        
        const data = await response.json();
        if (data.success) {
          setRiskData(data);
          // Notify parent component if needed
          if (onUpdate) {
            onUpdate({
              ...student,
              riskLevel: data.risk,
              riskScore: data.score
            });
          }
        }
      } catch (err) {
        console.error('Error fetching risk data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [student, onUpdate]);

  const getRiskColor = () => {
    if (!riskData) return 'gray';
    switch(riskData.risk) {
      case 'High': return 'red';
      case 'Moderate': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  const getRiskIcon = () => {
    if (!riskData) return <Info size={24} />;
    switch(riskData.risk) {
      case 'High': return <AlertCircle size={24} />;
      case 'Moderate': return <AlertTriangle size={24} />;
      case 'Low': return <CheckCircle size={24} />;
      default: return <Info size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="risk-card loading">
        <div className="spinner"></div>
        <p>Analyzing student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-card error">
        <AlertCircle size={24} />
        <p>Error loading risk assessment: {error}</p>
      </div>
    );
  }

  return (
    <div className={`risk-card ${riskData?.risk?.toLowerCase() || 'unknown'}`}>
      <div className="risk-header">
        <div className="risk-icon" style={{ color: getRiskColor() }}>
          {getRiskIcon()}
        </div>
        <div className="risk-title">
          <h3>Risk Assessment</h3>
          <span className="risk-level" style={{ color: getRiskColor() }}>
            {riskData?.risk || 'Unknown'}
          </span>
          {riskData?.score !== undefined && (
            <span className="risk-score">(Score: {riskData.score}/10)</span>
          )}
        </div>
      </div>
      
      {riskData?.tips && (
        <div className="risk-tips">
          <h4>Recommendations:</h4>
          <ul>
            {riskData.tips.map((tip, index) => (
              <li key={index}>
                <CheckCircle size={16} className="tip-icon" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

RiskCard.propTypes = {
  student: PropTypes.shape({
    attendance: PropTypes.number,
    cgpa: PropTypes.number,
    financialScore: PropTypes.number,
    studyHours: PropTypes.number,
    previousYearBacklogs: PropTypes.number,
    name: PropTypes.string,
    email: PropTypes.string
  }),
  onUpdate: PropTypes.func
};

export default RiskCard;
