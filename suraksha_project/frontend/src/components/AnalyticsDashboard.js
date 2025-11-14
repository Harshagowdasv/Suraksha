import React, { useEffect, useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";
import api from "../api";
import "../styles/analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard({ mentorOnlyEmail }) {
  const [students, setStudents] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const s = await api.get("/api/teacher/students", mentorOnlyEmail ? { params: { classTeacherEmail: mentorOnlyEmail } } : undefined);
        setStudents(s.data || []);
        const p = await api.get("/api/ai/predictions");
        setPredictions(p.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mentorOnlyEmail]);

  const names = useMemo(() => students.map((s) => s.name), [students]);
  const attendanceData = useMemo(() => students.map((s) => s.attendance ?? 0), [students]);
  const cgpaData = useMemo(() => students.map((s) => s.cgpa ?? 0), [students]);
  const financialBuckets = useMemo(() => {
    const low = students.filter((s) => (s.financialScore ?? 0) < 40).length;
    const mid = students.filter((s) => (s.financialScore ?? 0) >= 40 && (s.financialScore ?? 0) < 70).length;
    const high = students.filter((s) => (s.financialScore ?? 0) >= 70).length;
    return [low, mid, high];
  }, [students]);

  const highRisk = predictions.filter((x) => x.riskLevel === "High");

  if (loading) return <div className="glass-card" style={{ padding: 24 }}><div className="spinner" /></div>;
  if (error) return <div className="glass-card" style={{ padding: 24 }}><p className="error">{error}</p></div>;

  const fadeScale = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 } };

  return (
    <div className="analytics-container fade-in">
      <h2 className="analytics-title">📊 Student Insights Dashboard</h2>
      <div className="charts-grid">
        <motion.div {...fadeScale} className="chart-card glass-card">
          <Bar
            data={{
              labels: names,
              datasets: [{ label: "Attendance (%)", data: attendanceData, backgroundColor: "rgba(134,197,255,0.6)", borderColor: "#86c5ff" }],
            }}
            options={{ responsive: true, plugins: { legend: { labels: { color: "#eef3ff" } } }, scales: { x: { ticks: { color: "#c9d4ff" } }, y: { ticks: { color: "#c9d4ff" } } } }}
          />
        </motion.div>

        <motion.div {...fadeScale} className="chart-card glass-card">
          <Line
            data={{
              labels: names,
              datasets: [{ label: "CGPA", data: cgpaData, fill: false, borderColor: "#86c5ff", backgroundColor: "#86c5ff" }],
            }}
            options={{ responsive: true, plugins: { legend: { labels: { color: "#eef3ff" } } }, scales: { x: { ticks: { color: "#c9d4ff" } }, y: { ticks: { color: "#c9d4ff" } } } }}
          />
        </motion.div>

        <motion.div {...fadeScale} className="chart-card glass-card">
          <Pie
            data={{
              labels: ["Low Financial", "Medium", "High"],
              datasets: [{
                data: financialBuckets,
                backgroundColor: ["#ff7b7b", "#ffd26a", "#86ffb3"],
                borderColor: "rgba(255,255,255,0.35)",
              }],
            }}
            options={{ plugins: { legend: { labels: { color: "#eef3ff" } } } }}
          />
        </motion.div>
      </div>

      <motion.div {...fadeScale} className="glass-card risk-card">
        <h3 style={{ marginTop: 0 }}>⚠️ High Dropout Risk Students</h3>
        {highRisk.length === 0 ? (
          <p>No high risk students currently.</p>
        ) : (
          <ul className="list">
            {highRisk.map((p) => (
              <li key={p.email} className="list-item"><span>⚠️</span> {p.name} — Risk: {p.riskLevel}</li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
