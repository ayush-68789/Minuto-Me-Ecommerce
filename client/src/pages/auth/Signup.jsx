// Owner: M1
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../api/authApi';
import { IconCheck } from '../../components/common/Icons';
import AuthLayout, { ErrorBox } from './AuthLayout';

const strength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH = [['', '#e2e8f0'], ['Weak', '#ef4444'], ['Okay', '#f59e0b'], ['Good', '#10b981'], ['Strong', '#059669']];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const s = strength(form.password);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      await signup(form);
      navigate('/create-store', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Signup failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start free. Your branded store is a few clicks away."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <ErrorBox>{error}</ErrorBox>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" autoComplete="name" placeholder="Riya Sharma" required value={form.name} onChange={onChange} />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@business.com" required value={form.email} onChange={onChange} />
        </div>
        <div className="field" style={{ marginBottom: 24 }}>
          <label className="label" htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input className="input" id="password" name="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} value={form.password} onChange={onChange} style={{ paddingRight: 64 }} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= s ? STRENGTH[s][1] : '#e2e8f0', transition: 'background .2s' }} />
            ))}
          </div>
          {form.password && <div className="hint" style={{ color: STRENGTH[s][1] }}>{STRENGTH[s][0]} password</div>}
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <ul style={{ listStyle: 'none', padding: 0, margin: '22px 0 0', display: 'grid', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
          {['Free to start — no card needed', 'Your own store link in minutes', 'Passwords hashed with bcrypt'].map((t) => (
            <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><IconCheck size={16} color="#10b981" />{t}</li>
          ))}
        </ul>
      </form>
    </AuthLayout>
  );
}
