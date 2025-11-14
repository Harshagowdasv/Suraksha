import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("email", res.data.email);
      if (res.data.role === "teacher") navigate("/teacher");
      else if (res.data.role === "mentor") navigate("/mentor");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="center fade-in">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card">
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <p style={{ marginTop: -6, opacity: 0.85 }}>Sign in to continue</p>
        <form onSubmit={handleLogin} className="form-col">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </motion.div>
    </div>
  );
}
