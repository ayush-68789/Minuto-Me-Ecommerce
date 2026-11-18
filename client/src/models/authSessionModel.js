// Access JWTs live only in JavaScript memory. The refresh JWT is an HttpOnly cookie.
let accessToken = null;

export const authSessionModel = {
  getAccessToken() { return accessToken; },
  setAccessToken(token) { accessToken = token || null; },
  clearAccessToken() { accessToken = null; },
  headers(tenantId = 'default', json = true) {
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'x-tenant-id': tenantId,
    };
  },
};

export default authSessionModel;
