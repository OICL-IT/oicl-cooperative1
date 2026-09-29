import { Router } from 'express';
import { checkApplicationStatus, verifyStaff } from '../controllers/onboardingController.js';

const router = Router();

// Public route for membership activation
router.post('/verify-staff', verifyStaff);
router.post('/application-status', checkApplicationStatus);

export default router;
