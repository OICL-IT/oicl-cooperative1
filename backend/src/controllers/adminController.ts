import { Member } from '../models/Member.js';
import { Loan } from '../models/Loan.js';
import { Savings, AuditLog } from '../models/Savings.js';
import { EmployeeMaster } from '../models/EmployeeMaster.js';
import { SOP_RULES } from '../config/sop.js';
import { getPayrollPeriodStatus } from '../services/payrollGovernanceService.js';

const isMockMode = () => !process.env.MONGODB_URI;

export const getSummary = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json({ 
      totalSavings: 150000000, 
      activePortfolio: 75000000, 
      activeMembers: 124, 
      pendingApprovals: 5 
    });
    
    const [members, loans, pendingCount] = await Promise.all([
      Member.find({}),
      Loan.find({ status: 'active' }),
      Loan.countDocuments({ status: { $in: ['pending', 'awaiting_guarantors', 'awaiting_approval'] } })
    ]);

    const totalSavings = members.reduce((sum, m) => sum + (m.totalSavings || 0), 0);
    const activePortfolio = loans.reduce((sum, l) => sum + (l.balance || 0), 0);

    res.json({
      totalSavings,
      activePortfolio,
      activeMembers: members.filter(m => m.status === 'active').length,
      pendingApprovals: pendingCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployees = async (req: any, res: any) => {
  try {
    const employees = await EmployeeMaster.find({}).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEmployee = async (req: any, res: any) => {
  try {
    const employee = await EmployeeMaster.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkImportEmployees = async (req: any, res: any) => {
  try {
    const { employees } = req.body;
    const adminName = req.user?.fullName || 'System Admin';
    const now = new Date();

    const operations = employees.map((emp: any) => ({
      updateOne: {
        filter: { employeeId: emp.employeeId },
        update: { 
          $set: { 
            ...emp, 
            importedBy: adminName
          },
          $setOnInsert: { createdAt: now }
        },
        upsert: true
      }
    }));

    const result = await EmployeeMaster.bulkWrite(operations, { ordered: false });
    
    await AuditLog.create({
      action: 'Staff Bulk Import',
      details: `Imported/Updated ${employees.length} staff records`,
      actorName: adminName
    });

    res.json({ message: 'Import successful', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMembers = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json([]);
    const members = await Member.find({}).select('-password').sort({ fullName: 1 });
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMemberStatus = async (req: any, res: any) => {
  try {
    const { action, comment, registrationFeePaid } = req.body;
    const member = await Member.findById(req.params.id);
    const actor = await Member.findById(req.user.id);

    if (!member) return res.status(404).json({ error: 'Member application not found.' });

    const now = new Date();
    if (action === 'approve') {
      if (member.status !== 'pending_review') {
        return res.status(400).json({ error: 'Only applications pending EXCO review can be approved.' });
      }
      member.status = 'approved_pending_activation';
      member.approvedAt = now;
      member.approvedBy = actor?.fullName || req.user.role;
    } else if (action === 'reject') {
      if (member.status !== 'pending_review') {
        return res.status(400).json({ error: 'Only applications pending EXCO review can be rejected.' });
      }
      member.status = 'rejected';
    } else if (action === 'activate') {
      if (member.status !== 'approved_pending_activation') {
        return res.status(400).json({ error: 'The application must be approved before activation.' });
      }
      if (!registrationFeePaid) {
        return res.status(400).json({ error: `Confirm payment of the N${SOP_RULES.registrationFee.toLocaleString()} registration fee.` });
      }
      const sequence = (await Member.countDocuments({ membershipNumber: { $exists: true } })) + 1;
      member.membershipNumber = `CICS-${now.getFullYear()}-${String(sequence).padStart(4, '0')}`;
      member.status = 'active';
      member.dateJoined = now;
      member.registrationFee = { amount: SOP_RULES.registrationFee, paid: true, paidAt: now } as any;
      member.welcomeLetterIssuedAt = now;
    } else if (action === 'resign') {
      member.status = 'resigned';
    } else if (action === 'terminate') {
      member.status = 'terminated';
    } else {
      return res.status(400).json({ error: 'Unsupported membership action.' });
    }

    await member.save();
    await AuditLog.create({
      action: `Membership ${action}`,
      details: `${member.fullName} (${member.staffId}). ${comment || 'No comment supplied.'}`,
      actorName: actor?.fullName || req.user.role,
    });

    res.json({ message: `Membership ${action} completed.`, member });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Membership number collision. Please retry activation.' });
    res.status(500).json({ error: err.message });
  }
};

export const getAllLoans = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json([]);
    const loans = await Loan.find({}).sort({ createdAt: -1 });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLoanStatus = async (req: any, res: any) => {
  try {
    const { status, comment } = req.body;
    const admin = await Member.findById(req.user.id);
    
    const loan = await Loan.findByIdAndUpdate(req.params.id, {
      $set: { status },
      $push: { 
        statusHistory: { 
          status, 
          updatedBy: admin?.fullName || 'Admin', 
          comment 
        } 
      }
    }, { new: true });

    res.json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const processPayroll = async (req: any, res: any) => {
  try {
    const { period } = req.body;
    if (isMockMode()) return res.json({ message: 'Mock Payroll Success', processedCount: 10 });

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || '')) {
      return res.status(400).json({ error: 'Payroll period must use YYYY-MM format.' });
    }

    const periodStatus = await getPayrollPeriodStatus(period);
    if (periodStatus.periodLocked) {
      return res.status(423).json({
        error: `Payroll month ${period} is locked. Unlock the month before running system payroll.`,
      });
    }
    if (periodStatus.lockAutoPayroll) {
      return res.status(409).json({
        error: `Payroll for ${period} was already uploaded. To keep one source of truth, use the Payroll template upload flow for corrections instead of Run Payroll.`,
      });
    }

    const members = await Member.find({ status: 'active' });
    let processedCount = 0;

    for (const member of members) {
      const amount = Math.max(Number(member.monthlyContribution || 0), SOP_RULES.minimumMonthlyContribution);
      const ordinaryResult = await Savings.updateOne(
        { memberId: member._id, type: 'ordinary', period },
        { $setOnInsert: { amount, postedBy: 'SYSTEM_PAYROLL', timestamp: new Date() } },
        { upsert: true }
      );

      if (ordinaryResult.upsertedCount) {
        member.totalSavings += amount;
        processedCount += 1;
      }

      if (Number(member.targetSavingsContribution || 0) > 0) {
        await Savings.updateOne(
          { memberId: member._id, type: 'target', period },
          { $setOnInsert: { amount: member.targetSavingsContribution, postedBy: 'SYSTEM_PAYROLL', timestamp: new Date() } },
          { upsert: true }
        );
      }

      const payrollMonth = Number(period.slice(5, 7));
      if (
        payrollMonth >= SOP_RULES.developmentLevyStartMonth
        && payrollMonth <= SOP_RULES.developmentLevyEndMonth
      ) {
        await Savings.updateOne(
          { memberId: member._id, type: 'development_levy', period },
          { $setOnInsert: { amount: SOP_RULES.monthlyDevelopmentLevy, postedBy: 'SYSTEM_PAYROLL', timestamp: new Date() } },
          { upsert: true }
        );
      }

      if (
        payrollMonth >= SOP_RULES.agmLevyStartMonth
        && payrollMonth <= SOP_RULES.agmLevyEndMonth
      ) {
        await Savings.updateOne(
          { memberId: member._id, type: 'agm_levy', period },
          { $setOnInsert: { amount: SOP_RULES.monthlyAgmLevy, postedBy: 'SYSTEM_PAYROLL', timestamp: new Date() } },
          { upsert: true }
        );
      }

      await member.save();
    }

    await AuditLog.create({
      action: 'Payroll Executed',
      details: `Processed deductions for ${period}`,
      actorName: 'Admin System'
    });

    res.json({
      message: processedCount ? 'Payroll processed successfully' : 'Payroll was already processed for this period',
      processedCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
