import { Router } from 'express';
import { getMySavings } from '../controllers/savingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getMySavings);
export default router;
