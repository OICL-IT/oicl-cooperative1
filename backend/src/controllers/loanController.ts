import { Loan, LoanCategory } from '../models/Loan.js';
import { Member } from '../models/Member.js';
import { Savings } from '../models/Savings.js';
import { SOP_LOAN_PRODUCTS, SOP_RULES, addWorkingDays } from '../config/sop.js';

const isMockMode = () => !process.env.MONGODB_URI;

export const getMyLoans = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json([]);
    const loans = await Loan.find({ memberId: req.user.id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getLoanCategories = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json([
      ...SOP_LOAN_PRODUCTS.map((product, index) => ({
        _id: String(index + 1),
        ...product,
        minSavingsMultiplier: SOP_RULES.maximumLoanSavingsMultiplier,
        requiredGuarantors: 0,
        status: 'active',
      }))
    ]);
    const cats = await LoanCategory.find({ status: 'active' });
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const applyForLoan = async (req: any, res: any) => {
  try {
    const { categoryId, principal, tenure, guarantorIds = [], purpose } = req.body;
    if (isMockMode()) return res.json({ message: 'Mock Application Received' });

    const [member, category, guarantors, activeLoans, contributionHistory] = await Promise.all([
      Member.findById(req.user.id),
      LoanCategory.findById(categoryId),
      Member.find({ _id: { $in: guarantorIds }, status: 'active' }),
      Loan.find({ memberId: req.user.id, status: 'active' }),
      Savings.find({ memberId: req.user.id, type: { $in: ['ordinary', 'thrift'] } }).sort({ period: -1 }).limit(6),
    ]);

    if (!member || !category) return res.status(404).json({ error: 'Member or Category not found' });

    if (member.status !== 'active' || !member.dateJoined) {
      return res.status(403).json({ error: 'Only active members may apply for a loan.' });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - SOP_RULES.minimumLoanMembershipMonths);
    if (member.dateJoined > sixMonthsAgo) {
      return res.status(400).json({ error: 'Loan eligibility begins after 6 months of active membership.' });
    }

    const requiredPeriods = Array.from({ length: SOP_RULES.minimumLoanMembershipMonths }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (index + 1));
      return date.toISOString().slice(0, 7);
    });
    const contributedPeriods = new Set(contributionHistory.map(entry => entry.period));
    if (!requiredPeriods.every(period => contributedPeriods.has(period))) {
      return res.status(400).json({ error: 'Six up-to-date monthly ordinary contributions are required.' });
    }

    if (Number(tenure) !== category.maxTenure) {
      return res.status(400).json({ error: `${category.name} uses a fixed ${category.maxTenure}-month tenure.` });
    }

    if (category.code === 'commodity' && !purpose?.trim()) {
      return res.status(400).json({ error: 'List the selected food items for a commodity loan.' });
    }

    if (guarantors.length !== Number(category.requiredGuarantors || 0)) {
      return res.status(400).json({ error: `${category.requiredGuarantors || 0} active guarantor(s) are required.` });
    }

    // Verify Eligibility
    const outstandingBalance = activeLoans.reduce((sum, loan) => sum + Number(loan.balance || 0), 0);
    const leveragedSavings = Math.max(Number(member.totalSavings || 0) - outstandingBalance, 0);
    const maxEligible = leveragedSavings * SOP_RULES.maximumLoanSavingsMultiplier;
    if (principal > maxEligible) {
      return res.status(400).json({ error: `Requested principal exceeds the SOP limit of N${maxEligible.toLocaleString()} (2x unleveraged ordinary savings).` });
    }

    if (Number(principal) <= 0) return res.status(400).json({ error: 'Principal must be greater than zero.' });

    // Generate the prescribed reducing-balance or flat-interest repayment schedule.
    const monthlyPrincipal = principal / tenure;
    const schedule = [];
    let totalDeduction = 0;

    for (let i = 1; i <= tenure; i++) {
      const interest = category.interestMethod === 'reducing'
        ? (principal - (monthlyPrincipal * (i - 1))) * (category.interestRate / 100 / 12)
        : (principal * (category.interestRate / 100)) / tenure;
      const total = monthlyPrincipal + interest;
      totalDeduction = Math.max(totalDeduction, total);

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      schedule.push({
        dueDate,
        principalAmount: monthlyPrincipal,
        interestAmount: interest,
        totalAmount: total,
        status: 'pending'
      });
    }

    const netPay = Number(member.monthlyNetPay || 0);
    if (netPay <= 0) {
      return res.status(400).json({ error: 'Monthly net pay is missing from the HR record. Ask an administrator to update it before applying.' });
    }
    const existingLoanDeductions = activeLoans.reduce((sum, loan) => sum + Number(loan.monthlyDeduction || 0), 0);
    const projectedTakeHome = netPay
      - Number(member.monthlyStatutoryDeductions || 0)
      - Number(member.monthlyContribution || 0)
      - existingLoanDeductions
      - totalDeduction;
    if (projectedTakeHome < netPay * (SOP_RULES.minimumTakeHomePercentage / 100)) {
      return res.status(400).json({ error: 'This loan would reduce take-home pay below the required 33% of monthly net pay.' });
    }

    const submittedAt = new Date();

    const loan = await Loan.create({
      memberId: member._id,
      memberName: member.fullName,
      staffId: member.staffId,
      principal,
      balance: principal,
      interestRate: category.interestRate,
      tenure,
      monthlyDeduction: totalDeduction,
      projectedTakeHome,
      purpose: purpose?.trim(),
      category: { id: category._id, name: category.name, code: category.code, interestMethod: category.interestMethod },
      guarantors: guarantors.map(g => ({
        memberId: g._id,
        fullName: g.fullName,
        status: 'pending'
      })),
      repaymentSchedule: schedule,
      status: guarantors.length ? 'awaiting_guarantors' : 'awaiting_approval',
      statusHistory: [{ status: 'pending', updatedBy: member.fullName, comment: 'Application submitted' }],
      decisionDueAt: addWorkingDays(submittedAt, 5),
    });

    res.status(201).json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
