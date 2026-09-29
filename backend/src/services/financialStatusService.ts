import { Member } from '../models/Member.js';
import { Loan } from '../models/Loan.js';
import { Savings } from '../models/Savings.js';
import { SOP_RULES } from '../config/sop.js';

const CURRENT_LOAN_STATUSES = ['active', 'defaulted'];
const PENDING_LOAN_STATUSES = ['pending', 'awaiting_guarantors', 'awaiting_approval'];
const ORDINARY_TYPES = ['ordinary', 'thrift'];

export const normalizePeriod = (value: unknown) => {
  const period = String(value || new Date().toISOString().slice(0, 7));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new Error('Reporting period must use YYYY-MM format.');
  }
  return period;
};

const amountByTypes = (entries: any[], types: string[]) =>
  entries
    .filter(entry => types.includes(entry.type))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

const classifyLoan = (loan: any) => {
  const code = String(loan.category?.code || '').toLowerCase();
  const name = String(loan.category?.name || '').toLowerCase();
  if (code.includes('emergency') || name.includes('emergency')) return 'emergency';
  if (code.includes('commodity') || name.includes('commodity')) return 'commodity';
  return 'normal';
};

export const buildFinancialStatuses = async (memberFilter: Record<string, unknown>, period: string) => {
  const members = await Member.find(memberFilter).sort({ fullName: 1 }).lean();
  const memberIds = members.map(member => member._id);

  const [entries, loans] = await Promise.all([
    Savings.find({ memberId: { $in: memberIds }, period: { $lte: period } }).lean(),
    Loan.find({ memberId: { $in: memberIds } }).lean(),
  ]);

  const entriesByMember = new Map<string, any[]>();
  const loansByMember = new Map<string, any[]>();
  entries.forEach(entry => {
    const key = String(entry.memberId);
    entriesByMember.set(key, [...(entriesByMember.get(key) || []), entry]);
  });
  loans.forEach(loan => {
    const key = String(loan.memberId);
    loansByMember.set(key, [...(loansByMember.get(key) || []), loan]);
  });

  return members.map(member => {
    const key = String(member._id);
    const memberEntries = entriesByMember.get(key) || [];
    const memberLoans = loansByMember.get(key) || [];
    const currentLoans = memberLoans.filter(loan => CURRENT_LOAN_STATUSES.includes(loan.status));
    const pendingLoans = memberLoans.filter(loan => PENDING_LOAN_STATUSES.includes(loan.status));

    const loanBalances = { normal: 0, emergency: 0, commodity: 0 };
    const loanDeductions = { normal: 0, emergency: 0, commodity: 0 };
    currentLoans.forEach(loan => {
      const category = classifyLoan(loan);
      loanBalances[category] += Number(loan.balance || 0);
      loanDeductions[category] += Number(loan.monthlyDeduction || 0);
    });

    const ordinarySavings = amountByTypes(memberEntries, ORDINARY_TYPES);
    const targetSavings = amountByTypes(memberEntries, ['target']);
    const developmentLevy = amountByTypes(memberEntries, ['development_levy']);
    const agmLevy = amountByTypes(memberEntries, ['agm_levy']);
    const sharesFromLedger = amountByTypes(memberEntries, ['shares']);
    const monthlyOrdinary = Number(member.monthlyContribution || 0);
    const monthlyTarget = Number(member.targetSavingsContribution || 0);
    const reportMonth = Number(period.slice(5, 7));
    const monthlyDevelopmentLevy = reportMonth >= SOP_RULES.developmentLevyStartMonth
      && reportMonth <= SOP_RULES.developmentLevyEndMonth
      ? SOP_RULES.monthlyDevelopmentLevy
      : 0;
    const monthlyAgmLevy = reportMonth >= SOP_RULES.agmLevyStartMonth
      && reportMonth <= SOP_RULES.agmLevyEndMonth
      ? SOP_RULES.monthlyAgmLevy
      : 0;
    const totalLoanExposure = Object.values(loanBalances).reduce((sum, value) => sum + value, 0);
    const totalMonthlyDeduction = monthlyOrdinary
      + monthlyTarget
      + monthlyDevelopmentLevy
      + monthlyAgmLevy
      + Object.values(loanDeductions).reduce((sum, value) => sum + value, 0);

    return {
      memberId: key,
      staffId: member.staffId,
      email: member.email,
      membershipNumber: member.membershipNumber,
      fullName: member.fullName,
      department: member.department,
      companyName: member.companyName,
      membershipStatus: member.status,
      period,
      balances: {
        ordinarySavings: ordinarySavings || Number(member.totalSavings || 0),
        targetSavings,
        investmentShares: sharesFromLedger || Number(member.shareCapital || 0),
        agmLevy,
        developmentLevy,
        normalLoan: loanBalances.normal,
        emergencyLoan: loanBalances.emergency,
        commodityLoan: loanBalances.commodity,
        totalLoanExposure,
      },
      monthlyDeductions: {
        ordinarySavings: monthlyOrdinary,
        targetSavings: monthlyTarget,
        agmLevy: monthlyAgmLevy,
        developmentLevy: monthlyDevelopmentLevy,
        normalLoan: loanDeductions.normal,
        emergencyLoan: loanDeductions.emergency,
        commodityLoan: loanDeductions.commodity,
        total: totalMonthlyDeduction,
      },
      pendingLoanRequests: pendingLoans.map(loan => ({
        id: String(loan._id),
        category: loan.category?.name,
        principal: Number(loan.principal || 0),
        status: loan.status,
      })),
      remarks: member.financialRemarks || '',
    };
  });
};

export const summarizeFinancialStatuses = (statuses: any[]) => ({
  memberCount: statuses.length,
  activeMembers: statuses.filter(status => status.membershipStatus === 'active').length,
  totalOrdinarySavings: statuses.reduce((sum, status) => sum + status.balances.ordinarySavings, 0),
  totalTargetSavings: statuses.reduce((sum, status) => sum + status.balances.targetSavings, 0),
  totalLoanExposure: statuses.reduce((sum, status) => sum + status.balances.totalLoanExposure, 0),
  activeBorrowers: statuses.filter(status => status.balances.totalLoanExposure > 0).length,
  pendingLoanRequests: statuses.reduce((sum, status) => sum + status.pendingLoanRequests.length, 0),
});
