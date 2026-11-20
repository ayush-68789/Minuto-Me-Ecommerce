// Owner: M1
import { createContext, useCallback, useEffect, useState } from 'react';
import { fetchMe, loginRequest, logoutRequest, signupRequest } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the cookie on first load
  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data) => {
    const u = await loginRequest(data);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (data) => {
    const u = await signupRequest(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      localStorage.removeItem('minuto_store_id');
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const u = await fetchMe();
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
