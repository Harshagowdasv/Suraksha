import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "mentor" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/register", form);
      alert("Registered successfully! Now login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="center fade-in">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card">
        <h2 style={{ marginTop: 0 }}>Create account</h2>
        <form onSubmit={handleRegister} className="form-col">
          <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select onChange={(e) => setForm({ ...form, role: e.target.value })} defaultValue="mentor">
            <option value="mentor">Mentor</option>
            <option value="teacher">Teacher</option>
          </select>
          <button className="btn" type="submit">Register</button>
        </form>
      </motion.div>
    </div>
  );
}
