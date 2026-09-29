import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { completeMeeting, createMeeting, createSpecialLevy, getGovernance } from '../controllers/governanceController.js';

const router = Router();
router.use(authenticate);
router.get('/', getGovernance);
router.post('/meetings', authorize(['admin', 'president']), createMeeting);
router.patch('/meetings/:id/complete', authorize(['admin', 'president']), completeMeeting);
router.post('/special-levies', authorize(['admin', 'president', 'treasurer']), createSpecialLevy);

export default router;
