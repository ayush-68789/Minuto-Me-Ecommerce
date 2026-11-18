import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authSessionModel from '../../models/authSessionModel.js';

const AuthContext = createContext(null);

async function authRequest(action, payload, token) {
  const method = action === 'me' ? 'GET' : 'POST';
  const response = await fetch(`/api/auth/${action}`, {
    method,
    credentials: 'include',
    headers: {
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message || 'The request could not be completed. Please try again.');
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [status, setStatus] = useState('checking');

  const acceptTokens = useCallback((data) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    authSessionModel.setAccessToken(data.accessToken);
    setExpiresAt(Date.now() + Number(data.expiresIn || 900) * 1000);
    setStatus('authenticated');
  }, []);

  const renewSession = useCallback(async () => {
    const data = await authRequest('refresh');
    acceptTokens(data);
    return data;
  }, [acceptTokens]);

  useEffect(() => {
    let active = true;
    try { window.localStorage.removeItem('minuto_access_token'); } catch { /* Authentication never depends on browser storage. */ }
    authRequest('refresh')
      .then((data) => { if (active) acceptTokens(data); })
      .catch(() => {
        if (active && !authSessionModel.getAccessToken()) {
          authSessionModel.clearAccessToken();
          setUser(null);
          setAccessToken(null);
          setStatus('guest');
        }
      });
    return () => { active = false; };
  }, [acceptTokens]);

  useEffect(() => {
    if (status !== 'authenticated' || !expiresAt) return undefined;
    const delay = Math.max(1000, expiresAt - Date.now() - 60_000);
    const timer = window.setTimeout(() => {
      renewSession().catch(() => {
        authSessionModel.clearAccessToken();
        setUser(null);
        setAccessToken(null);
        setStatus('guest');
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [status, expiresAt, renewSession]);

  const authenticate = useCallback(async (action, credentials) => {
    const data = await authRequest(action, credentials);
    acceptTokens(data);
    return data.user;
  }, [acceptTokens]);

  const login = useCallback((credentials) => authenticate('login', credentials), [authenticate]);
  const register = useCallback((credentials) => authenticate('register', credentials), [authenticate]);
  const logout = useCallback(async () => {
    try { await authRequest('logout', null, accessToken); }
    catch { /* Clear the in-memory access token even when the API is unavailable. */ }
    finally {
      authSessionModel.clearAccessToken();
      setAccessToken(null);
      setExpiresAt(0);
      setUser(null);
      setStatus('guest');
    }
  }, [accessToken]);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
