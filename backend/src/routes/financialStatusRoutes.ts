import { Router } from 'express';
import { getFinancialStatusReport, getMyFinancialStatus, updateFinancialRemarks } from '../controllers/financialStatusController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const REPORT_ROLES = ['admin', 'president', 'treasurer', 'auditor'];

router.get('/me', authenticate, getMyFinancialStatus);
router.get('/report', authenticate, authorize(REPORT_ROLES), getFinancialStatusReport);
router.patch('/members/:id/remarks', authenticate, authorize(REPORT_ROLES), updateFinancialRemarks);

export default router;
