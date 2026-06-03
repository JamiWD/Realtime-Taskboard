import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-container">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">⚡</div>
          <h1>TaskBoard</h1>
          <p>Real-time collaborative task management</p>
        </div>

        {/* Card */}
        <div className="auth-card card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <span className="loader" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-hint">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <p className="auth-demo-hint">
          💡 Open multiple tabs to see real-time collaboration in action
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 24px;
        }
        .auth-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
        }
        .auth-orb-1 {
          width: 500px; height: 500px;
          background: var(--accent);
          top: -100px; left: -100px;
        }
        .auth-orb-2 {
          width: 400px; height: 400px;
          background: var(--accent-2);
          bottom: -80px; right: -80px;
        }
        .auth-container {
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column;
          align-items: center; gap: 24px;
          position: relative; z-index: 1;
        }
        .auth-brand { text-align: center; }
        .auth-logo { font-size: 2.5rem; margin-bottom: 8px; }
        .auth-brand h1 { font-family: var(--font-display); font-size: 2rem; letter-spacing: -0.02em; }
        .auth-brand p { color: var(--text-muted); font-size: 0.9rem; margin-top: 4px; }
        .auth-card { width: 100%; padding: 0; }
        .auth-tabs { display: flex; border-bottom: 1px solid var(--border); }
        .auth-tab {
          flex: 1; padding: 16px; background: none; border: none;
          color: var(--text-muted); font-family: var(--font-display);
          font-size: 0.9rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .auth-tab.active { color: var(--text); border-bottom-color: var(--accent); }
        .auth-tab:hover:not(.active) { color: var(--text); }
        .auth-form { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
        .auth-hint {
          text-align: center; padding: 0 24px 20px;
          font-size: 0.85rem; color: var(--text-muted);
        }
        .auth-hint button {
          background: none; border: none; color: var(--accent);
          cursor: pointer; font-size: inherit;
        }
        .auth-hint button:hover { text-decoration: underline; }
        .auth-demo-hint {
          font-size: 0.8rem; color: var(--text-dim); text-align: center;
          background: var(--bg-3); border: 1px solid var(--border);
          padding: 10px 16px; border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
