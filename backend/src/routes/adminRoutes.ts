import { Router } from 'express';
import { getSummary, getMembers, getAllLoans, updateLoanStatus, updateMemberStatus, processPayroll, getEmployees, updateEmployee, bulkImportEmployees } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize(['admin', 'president', 'treasurer']));

router.get('/summary', getSummary);
router.get('/members', getMembers);
router.patch('/members/:id/status', updateMemberStatus);
router.get('/loans', getAllLoans);
router.patch('/loans/:id', updateLoanStatus);
router.post('/payroll', processPayroll);
router.get('/staff', getEmployees);
router.patch('/staff/:id', updateEmployee);
router.post('/staff/import', bulkImportEmployees);

export default router;
