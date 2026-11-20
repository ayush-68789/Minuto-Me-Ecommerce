// Owner: M1
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../api/authApi';
import AuthLayout, { ErrorBox } from './AuthLayout';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const doLogin = async (creds) => {
    setError('');
    setBusy(true);
    try {
      const user = await login(creds);
      navigate(user.store ? location.state?.from || '/dashboard' : '/create-store', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your store, products and orders."
      footer={<>New to Minuto Me? <Link to="/signup">Create an account</Link></>}
    >
      <ErrorBox>{error}</ErrorBox>
      <form onSubmit={(e) => { e.preventDefault(); doLogin(form); }}>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@business.com" required value={form.email} onChange={onChange} />
        </div>
        <div className="field" style={{ marginBottom: 26 }}>
          <label className="label" htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input className="input" id="password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" required value={form.password} onChange={onChange} style={{ paddingRight: 64 }} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
