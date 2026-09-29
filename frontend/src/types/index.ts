export type UserRole = 'member' | 'admin' | 'treasurer' | 'president' | 'auditor' | 'cooperative_officer' | 'hr_admin' | 'financial_secretary' | 'it_admin';

export type MembershipStatus = 'pending_review' | 'approved_pending_activation' | 'active' | 'resigned' | 'terminated' | 'rejected' | 'retired';

export interface Member {
  _id: string; // Mongoose primary key
  staffId: string;
  fullName: string;
  email: string;
  department: string;
  role: UserRole;
  status: MembershipStatus;
  dateJoined: string;
  totalSavings: number;
  shareCapital: number;
  welfareBalance: number;
  phoneNumber?: string;
  nextOfKin?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export type LoanStatus = 'pending' | 'guarantor_review' | 'executive_review' | 'approved' | 'disbursed' | 'rejected' | 'closed';

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  categoryId: string;
  categoryName: string;
  principal: number;
  interestTotal: number;
  balance: number;
  status: LoanStatus;
  repaymentMonths: number;
  monthlyDeduction: number;
  guarantors: string[]; // List of member UIDs
  guarantorApprovals: Record<string, 'pending' | 'accepted' | 'rejected'>;
  createdAt: string;
  updatedAt: string;
  approvalChain: {
    step: string;
    actorRole: UserRole;
    actorId?: string;
    status: 'pending' | 'approved' | 'rejected';
    remarks?: string;
    timestamp?: string;
  }[];
}

export interface SavingsEntry {
  id: string;
  memberId: string;
  amount: number;
  type: 'thrift' | 'shares' | 'welfare' | 'emergency';
  period: string; // YYYY-MM
  timestamp: string;
  postedBy: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

export interface FinancialStatus {
  memberId: string;
  staffId: string;
  email: string;
  membershipNumber?: string;
  fullName: string;
  department: string;
  companyName: string;
  membershipStatus: MembershipStatus;
  period: string;
  balances: {
    ordinarySavings: number;
    targetSavings: number;
    investmentShares: number;
    agmLevy: number;
    developmentLevy: number;
    normalLoan: number;
    emergencyLoan: number;
    commodityLoan: number;
    totalLoanExposure: number;
  };
  monthlyDeductions: {
    ordinarySavings: number;
    targetSavings: number;
    agmLevy: number;
    developmentLevy: number;
    normalLoan: number;
    emergencyLoan: number;
    commodityLoan: number;
    total: number;
  };
  pendingLoanRequests: Array<{
    id: string;
    category: string;
    principal: number;
    status: string;
  }>;
  remarks: string;
}

export interface EmployeeMaster {
  _id?: string;
  employeeId: string;
  payrollNumber: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  phoneNumber: string;
  department: string;
  gradeLevel: string;
  branch: string;
  employmentStatus: 'active' | 'inactive' | 'suspended';
  dateOfEmployment: string;
  staffCategory: string;
  companyName?: string;
  jobTitle?: string;
  monthlyNetPay?: number;
  monthlyStatutoryDeductions?: number;
  importedBy?: string;
  createdAt?: string;
}
