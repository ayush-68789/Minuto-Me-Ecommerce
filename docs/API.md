<!-- Owner: M1 -->

## Authentication sessions

Owner and customer sign-up/login responses include a short-lived `accessToken` and `expiresIn` (900 seconds). The API also sets an HTTP-only access cookie and an HTTP-only refresh cookie. Clients should keep the returned access token in memory and send it as `Authorization: Bearer <accessToken>`; the shared client automatically calls `POST /api/auth/refresh` after an access-token 401 and retries the original request.

`POST /api/auth/refresh` renews the access token when the refresh session is valid. Refresh sessions are stored as token hashes, expire after seven days without use, and are revoked by `POST /api/auth/logout` or account deletion. Production cookies use `SameSite=None; Secure` so configured exported-store origins can authenticate across hosts. Set `CLIENT_URL` to a comma-separated allowlist of the generator and exported-store origins, and set `VITE_API_URL` in each client build to the API base URL.

The generator and `/store/:slug` storefront currently use the same React client and authentication API. A separate exported client should reuse `client/src/api/axiosInstance.js` and `client/src/api/authApi.js` to get the same bearer-token and refresh behavior.
