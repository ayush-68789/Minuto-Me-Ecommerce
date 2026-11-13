// Owner: Member 1 — shared client access-token storage for authenticated API calls.
const TOKEN_KEY = 'minuto_access_token';

export const authSessionModel = {
  getToken() {
    return globalThis.localStorage?.getItem(TOKEN_KEY) || null;
  },
  saveToken(token) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
  },
  headers(tenantId = 'default', json = true) {
    const token = this.getToken();
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-id': tenantId,
    };
  },
};

export default authSessionModel;
