export const SOP_RULES = {
  registrationFee: 5_000,
  minimumMonthlyContribution: 8_000,
  monthlyDevelopmentLevy: 5_000,
  developmentLevyStartMonth: 1,
  developmentLevyEndMonth: 5,
  monthlyAgmLevy: 1_430,
  agmLevyStartMonth: 6,
  agmLevyEndMonth: 12,
  membershipReviewWorkingDays: 3,
  membershipIssueWorkingDays: 7,
  minimumLoanMembershipMonths: 6,
  maximumLoanSavingsMultiplier: 2,
  minimumTakeHomePercentage: 33,
  specialLevyNoticeDays: 14,
} as const;

export const SOP_LOAN_PRODUCTS = [
  {
    code: 'normal',
    name: 'Normal Loan',
    description: '13-month facility charged at 15% per annum on the reducing balance.',
    interestRate: 15,
    interestMethod: 'reducing',
    maxTenure: 13,
  },
  {
    code: 'emergency',
    name: 'Emergency Loan',
    description: 'Three-month emergency facility charged at 10% flat interest.',
    interestRate: 10,
    interestMethod: 'flat',
    maxTenure: 3,
  },
  {
    code: 'commodity',
    name: 'Commodity Loan',
    description: 'Selected food items only, repaid over two months at 5% flat interest.',
    interestRate: 5,
    interestMethod: 'flat',
    maxTenure: 2,
  },
] as const;

export const addWorkingDays = (date: Date, workingDays: number) => {
  const result = new Date(date);
  let remaining = workingDays;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return result;
};
