// Owner: M1
import { createContext, useCallback, useEffect, useState } from 'react';
import { fetchMe, loginRequest, customerLoginRequest, logoutRequest, signupRequest, customerSignupRequest, deleteCustomerRequest, updateCustomerRequest } from '../api/authApi';

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

  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener('minuto-auth-expired', expireSession);
    return () => window.removeEventListener('minuto-auth-expired', expireSession);
  }, []);

  const login = useCallback(async (data) => {
    const u = await loginRequest(data);
    setUser(u);
    return u;
  }, []);

  const loginCustomer = useCallback(async (data) => {
    const u = await customerLoginRequest(data);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (data) => {
    const u = await signupRequest(data);
    setUser(u);
    return u;
  }, []);

  const signupCustomer = useCallback(async (data) => {
    const u = await customerSignupRequest(data);
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

  const deleteAccount = useCallback(async (storeSlug) => {
    await deleteCustomerRequest(storeSlug);
    localStorage.removeItem('minuto_store_id');
    setUser(null);
  }, []);

  const updateCustomerProfile = useCallback(async (data) => {
    const u = await updateCustomerRequest(data);
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginCustomer, signup, signupCustomer, logout, deleteAccount, updateCustomerProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
