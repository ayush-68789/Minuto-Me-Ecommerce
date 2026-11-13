// Owner: Member 1 — authentication endpoints.
import { Router } from 'express';
import {
  checkLogin,
  checkRegistration,
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { loginAccountRateLimit, loginIpRateLimit, registerRateLimit } from '../middleware/tokenBucketRateLimit.js';

const router = Router();
router.post('/register', registerRateLimit, validateRequest(checkRegistration), asyncHandler(register));
router.post('/login', loginIpRateLimit, loginAccountRateLimit, validateRequest(checkLogin), asyncHandler(login));
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
