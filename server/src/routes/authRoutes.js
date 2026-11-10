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

const router = Router();
router.post('/register', validateRequest(checkRegistration), asyncHandler(register));
router.post('/login', validateRequest(checkLogin), asyncHandler(login));
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
