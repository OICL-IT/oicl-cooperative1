import { Member } from '../models/Member.js';
import { buildFinancialStatuses, normalizePeriod, summarizeFinancialStatuses } from '../services/financialStatusService.js';

const isMockMode = () => !process.env.MONGODB_URI;

const mockStatus = (period: string) => ({
  memberId: 'mock-admin',
  staffId: 'OICL-001',
  email: 'admin@oduainvest.com.ng',
  membershipNumber: 'CICS-2026-0001',
  fullName: 'Mock Admin',
  department: 'Cooperative Secretariat',
  companyName: 'OICL',
  membershipStatus: 'active',
  period,
  balances: {
    ordinarySavings: 684556,
    targetSavings: 300000,
    investmentShares: 3000,
    agmLevy: 1430,
    developmentLevy: 25000,
    normalLoan: 0,
    emergencyLoan: 0,
    commodityLoan: 0,
    totalLoanExposure: 0,
  },
  monthlyDeductions: {
    ordinarySavings: 5000,
    targetSavings: 50000,
    agmLevy: 1430,
    developmentLevy: 0,
    normalLoan: 0,
    emergencyLoan: 0,
    commodityLoan: 0,
    total: 56430,
  },
  pendingLoanRequests: [],
  remarks: 'Demonstration record shown while MongoDB is not connected.',
});

export const getMyFinancialStatus = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.query.period);
    if (isMockMode()) return res.json(mockStatus(period));
    const [status] = await buildFinancialStatuses({ _id: req.user.id }, period);
    if (!status) return res.status(404).json({ error: 'Member financial status not found.' });
    res.json(status);
  } catch (err: any) {
    res.status(err.message?.includes('YYYY-MM') ? 400 : 500).json({ error: err.message });
  }
};

export const getFinancialStatusReport = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.query.period);
    if (isMockMode()) {
      const statuses = [mockStatus(period)];
      return res.json({ period, summary: summarizeFinancialStatuses(statuses), members: statuses });
    }
    const statuses = await buildFinancialStatuses({}, period);
    res.json({ period, summary: summarizeFinancialStatuses(statuses), members: statuses });
  } catch (err: any) {
    res.status(err.message?.includes('YYYY-MM') ? 400 : 500).json({ error: err.message });
  }
};

export const updateFinancialRemarks = async (req: any, res: any) => {
  try {
    const remarks = String(req.body.remarks || '').trim().slice(0, 1000);
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: { financialRemarks: remarks } },
      { new: true },
    ).select('financialRemarks');
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    res.json({ remarks: member.financialRemarks || '' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
