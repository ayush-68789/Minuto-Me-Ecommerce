// Owner: M1
import express from 'express';
import { signup, signupCustomer, login, customerLogin, logout, refreshSession, getCurrentUser, deleteCustomerAccount, updateCustomerProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/customer/signup', signupCustomer);
router.post('/login', login);
router.post('/customer/login', customerLogin);
router.post('/refresh', refreshSession);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);
router.patch('/profile', authMiddleware, updateCustomerProfile);
router.delete('/account', authMiddleware, deleteCustomerAccount);

export default router;
