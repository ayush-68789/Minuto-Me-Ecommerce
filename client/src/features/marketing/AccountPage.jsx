import { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { navigateTo } from '../../shared/navigation.js';

function BrandLink() {
  return <a className="public-brand" href="/" onClick={(event) => { event.preventDefault(); navigateTo('/'); }}><span className="public-brand-mark">M</span><span><strong>Minuto Mein Ecommerce</strong><small>STORE STUDIO</small></span></a>;
}

export default function AccountPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [state, setState] = useState({ busy: false, error: '' });
  const params = new URLSearchParams(window.location.search);
  const destination = '/studio/overview';

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: '' });
    try {
      if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await login({ email: form.email.trim(), password: form.password });
      navigateTo(destination, true);
    } catch (error) {
      setState({ busy: false, error: error.message || 'Could not connect to the account service.' });
    }
  }

  return <main className="account-screen">
    <section className="account-visual"><div className="account-visual-pattern pattern-one"/><div className="account-visual-pattern pattern-two"/><BrandLink /><div className="account-visual-copy"><span className="account-kicker">YOUR STORE STARTS HERE</span><h1>Build something<br/>worth <em>coming back to.</em></h1><p>Bring your store idea into focus. Create your brand, preview your storefront, and take your project with you.</p><div className="account-visual-points"><span>01 <i>Storefront design</i></span><span>02 <i>Features that fit</i></span><span>03 <i>Project export</i></span></div></div><div className="account-visual-bottom"><span>MINUTO MEIN ECOMMERCE</span><span>DESIGN · BUILD · EXPORT</span></div></section>
    <section className="account-form-side"><button className="account-back" onClick={() => navigateTo('/')}>← <span>Back to home</span></button><div className="account-form-wrap"><span className="account-kicker">{isRegister ? 'A BETTER WAY TO BEGIN' : 'WELCOME BACK'}</span><h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2><p className="account-intro">{isRegister ? 'Set up your account to start building and save your store draft in this browser.' : 'Pick up where you left off and keep shaping your storefront.'}</p><form className="account-form" onSubmit={submit}>
      {isRegister && <label><span>Your name</span><input autoComplete="name" maxLength="80" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="How should we address you?" /></label>}
      <label><span>Email address</span><input autoComplete="email" type="email" maxLength="254" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@yourbusiness.com" /></label>
      <label><span>Password</span><input autoComplete={isRegister ? 'new-password' : 'current-password'} type="password" minLength={isRegister ? 8 : undefined} maxLength={128} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} />{isRegister && <small>Use 8 to 128 characters.</small>}</label>
      {state.error && <div className="account-error" role="alert"><span>!</span><p>{state.error}</p></div>}
      <button className="public-button solid account-submit" type="submit" disabled={state.busy}>{state.busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'} <span>→</span></button>
    </form><div className="account-switch">{isRegister ? <>Already have an account? <button onClick={() => navigateTo(`/login${params.get('next') ? `?next=${encodeURIComponent(destination)}` : ''}`)}>Log in</button></> : <>New to Minuto Mein Ecommerce? <button onClick={() => navigateTo(`/register${params.get('next') ? `?next=${encodeURIComponent(destination)}` : ''}`)}>Create an account</button></>}</div><div className="account-security"><span>▣</span><p>Sign-in uses short-lived access tokens and a secure, rotating refresh cookie. Account creation is for the local demo workspace.</p></div></div><footer className="account-foot">© {new Date().getFullYear()} Minuto Mein Ecommerce <span>·</span> <button onClick={() => navigateTo('/')}>Home</button></footer></section>
  </main>;
}
