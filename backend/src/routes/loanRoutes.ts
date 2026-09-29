import { Router } from 'express';
import { getMyLoans, getLoanCategories, applyForLoan } from '../controllers/loanController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/my-loans', getMyLoans);
router.get('/categories', getLoanCategories);
router.post('/apply', applyForLoan);

export default router;
