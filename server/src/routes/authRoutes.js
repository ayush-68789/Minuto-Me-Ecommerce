// Owner: Member 1 — authentication endpoints.
import { Router } from 'express';
import {
  checkLogin,
  checkRegistration,
  getCurrentUser,
  login,
  refresh,
  logout,
  register,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { loginAccountRateLimit, loginIpRateLimit, registerRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
const rateLimits = (...middleware) => process.env.RATE_LIMITING_ENABLED === 'true' ? middleware : [];
router.post('/register', ...rateLimits(registerRateLimit), validateRequest(checkRegistration), asyncHandler(register));
router.post('/login', ...rateLimits(loginIpRateLimit, loginAccountRateLimit), validateRequest(checkLogin), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', authenticate, getCurrentUser);

export default router;
