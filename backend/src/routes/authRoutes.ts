import { Router } from 'express';
import { forgotPassword, getMe, login, register, resetPassword } from '../controllers/authController.js';
import { validateRegister } from '../middleware/validationMiddleware.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', validateRegister, register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

export default router;
