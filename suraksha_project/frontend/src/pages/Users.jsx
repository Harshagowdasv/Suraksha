import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    try {
      const res = await api.post('/api/users', { name, email });
      setSuccess('User created');
      setName('');
      setEmail('');
      setUsers((prev) => [res.data.data, ...prev]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create user';
      setError(msg);
    }
  };

  return (
    <div>
      <h3>Users</h3>

      <form onSubmit={onSubmit} className="card">
        <div className="form-row">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Add</button>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p>No users yet</p>
        ) : (
          <ul className="list">
            {users.map((u) => (
              <li key={u._id} className="list-item">
                <span>{u.name}</span>
                <span className="muted">{u.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
