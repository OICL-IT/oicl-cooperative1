import { Member } from '../models/Member.js';
import { Loan } from '../models/Loan.js';
import { Savings, AuditLog } from '../models/Savings.js';
import { buildFinancialStatuses, normalizePeriod } from '../services/financialStatusService.js';
import { getPayrollPeriodStatus, setPayrollPeriodLockState } from '../services/payrollGovernanceService.js';

const SAVINGS_COLUMNS = [
  { column: 'ordinary_savings', type: 'ordinary' },
  { column: 'target_savings', type: 'target' },
  { column: 'agm_levy', type: 'agm_levy' },
  { column: 'development_levy', type: 'development_levy' },
] as const;
const LOAN_COLUMNS = ['normal_loan', 'emergency_loan', 'commodity_loan'] as const;

const classifyLoan = (loan: any) => {
  const text = `${loan.category?.code || ''} ${loan.category?.name || ''}`.toLowerCase();
  if (text.includes('emergency')) return 'emergency_loan';
  if (text.includes('commodity')) return 'commodity_loan';
  return 'normal_loan';
};

// Returns the expected deductions for every active member so the template can be pre-filled.
export const getPayrollTemplate = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.query.period);
    if (!process.env.MONGODB_URI) return res.json({ period, rows: [] });

    const statuses = await buildFinancialStatuses({ status: 'active' }, period);
    const rows = statuses.map(s => ({
      staff_id: s.staffId,
      full_name: s.fullName,
      company_name: s.companyName,
      ordinary_savings: s.monthlyDeductions.ordinarySavings,
      target_savings: s.monthlyDeductions.targetSavings,
      agm_levy: s.monthlyDeductions.agmLevy,
      development_levy: s.monthlyDeductions.developmentLevy,
      normal_loan: s.monthlyDeductions.normalLoan,
      emergency_loan: s.monthlyDeductions.emergencyLoan,
      commodity_loan: s.monthlyDeductions.commodityLoan,
    }));
    res.json({ period, rows });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPayrollStatus = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.query.period);
    if (!process.env.MONGODB_URI) {
      return res.json({
        period,
        status: 'not_processed',
        systemGeneratedEntries: 0,
        uploadedEntries: 0,
        periodLocked: false,
        lockedAt: null,
        lockedBy: '',
        unlockedAt: null,
        unlockedBy: '',
        lockNote: '',
        lockAutoPayroll: false,
      });
    }
    res.json(await getPayrollPeriodStatus(period));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const setPayrollPeriodLock = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.body.period);
    const locked = req.body.locked;
    if (typeof locked !== 'boolean') {
      return res.status(400).json({ error: 'The "locked" field must be true or false.' });
    }

    const role = String(req.user?.role || '').toLowerCase();
    if (!locked && !['admin', 'president'].includes(role)) {
      return res.status(403).json({ error: 'Only admin or president can unlock a closed payroll month.' });
    }

    const actor = req.user?.fullName || req.user?.role || 'Admin';
    await setPayrollPeriodLockState(period, locked, actor, req.body.note);
    const latest = await getPayrollPeriodStatus(period);

    await AuditLog.create({
      action: locked ? 'Payroll Month Locked' : 'Payroll Month Unlocked',
      details: `${period} set to ${locked ? 'LOCKED' : 'UNLOCKED'}.`,
      actorName: actor,
    });

    res.json({
      message: locked
        ? `Payroll month ${period} is now locked.`
        : `Payroll month ${period} is now unlocked.`,
      ...latest,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const parseAmount = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (raw === '') return 0;

  // Allow common payroll formats such as:
  // 30,000.00 | 30.000,00 | 30000 | ₦ 30 000
  let normalized = raw
    .replace(/[']/g, '')
    .replace(/\s/g, '')
    .replace(/[^0-9,.\-]/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    const decimalSeparator = normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.';
    if (decimalSeparator === ',') {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = normalized.split(',');
    const decimalLike = parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2;
    normalized = decimalLike ? `${parts[0]}.${parts[1]}` : parts.join('');
  } else if (hasDot) {
    const parts = normalized.split('.');
    const thousandLike = parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length > 0);
    if (thousandLike) normalized = parts.join('');
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN;
};

// Posts the actual monthly deductions uploaded from the filled payroll template.
export const uploadPayroll = async (req: any, res: any) => {
  try {
    const period = normalizePeriod(req.body.period);
    const rows: any[] = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ error: 'The uploaded file has no payroll rows.' });
    if (!process.env.MONGODB_URI) return res.json({ message: 'Mock payroll upload', processed: rows.length, errors: [] });

    const actor = req.user?.fullName || req.user?.role || 'Admin';
    const periodStatus = await getPayrollPeriodStatus(period);
    if (periodStatus.periodLocked) {
      return res.status(423).json({ error: `Payroll month ${period} is locked. Unlock the month before posting adjustments.` });
    }
    const errors: { row: number; staffId: string; error: string }[] = [];
    const notices: string[] = [];
    let processed = 0;
    if (periodStatus.status === 'system_processed') {
      notices.push(`System payroll was already run for ${period}. Uploaded savings and levies will override those system-generated entries.`);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const staffId = String(row.staff_id || '').trim();
      const rowNumber = i + 2;
      const fail = (error: string) => errors.push({ row: rowNumber, staffId, error });
      try {
      if (!staffId) { fail('Missing staff_id.'); continue; }

      const member = await Member.findOne({ staffId, status: 'active' });
      if (!member) { fail('No active member with this staff ID.'); continue; }

      const amounts: Record<string, number> = {};
      let invalid = '';
      [...SAVINGS_COLUMNS.map(c => c.column), ...LOAN_COLUMNS].forEach(column => {
        const amount = parseAmount(row[column]);
        if (Number.isNaN(amount)) invalid = column;
        amounts[column] = amount;
      });
      if (invalid) { fail(`Invalid amount in ${invalid}.`); continue; }

      for (const { column, type } of SAVINGS_COLUMNS) {
        const amount = amounts[column];
        const existing = await Savings.findOne({ memberId: member._id, type, period });
        if (!existing && amount === 0) continue;
        const previous = existing?.amount || 0;
        await Savings.updateOne(
          { memberId: member._id, type, period },
          { $set: { amount, postedBy: `PAYROLL_UPLOAD:${actor}`, timestamp: new Date() } },
          { upsert: true }
        );
        if (type === 'ordinary') member.totalSavings = (member.totalSavings || 0) + amount - previous;
      }

      const totalLoan = LOAN_COLUMNS.reduce((sum, c) => sum + amounts[c], 0);
      if (totalLoan > 0) {
        const alreadyPosted = await Savings.exists({ memberId: member._id, type: 'loan_repayment', period });
        if (alreadyPosted) {
          notices.push(`${staffId}: loan repayments for ${period} were already posted and were not applied again.`);
        } else {
          const loans = await Loan.find({ memberId: member._id, status: { $in: ['active', 'defaulted'] } }).sort({ disbursedAt: 1, createdAt: 1 });
          let applied = 0;
          for (const column of LOAN_COLUMNS) {
            let remaining = amounts[column];
            for (const loan of loans.filter(l => classifyLoan(l) === column)) {
              if (remaining <= 0) break;
              const pay = Math.min(remaining, loan.balance || 0);
              if (pay <= 0) continue;
              loan.balance -= pay;
              remaining -= pay;
              applied += pay;
              if (loan.balance <= 0) {
                loan.status = 'repaid';
                loan.statusHistory.push({ status: 'repaid', updatedBy: actor, comment: `Fully repaid via ${period} payroll` } as any);
              }
              await loan.save();
            }
            if (remaining > 0) notices.push(`${staffId}: ${remaining} of ${column} exceeds the outstanding balance and was not applied.`);
          }
          if (applied > 0) {
            await Savings.create({ memberId: member._id, type: 'loan_repayment', period, amount: applied, postedBy: `PAYROLL_UPLOAD:${actor}` });
          }
        }
      }

      await member.save();
      processed += 1;
      } catch (rowErr: any) {
        fail(rowErr.message || 'Unexpected error while posting this row.');
      }
    }

    await AuditLog.create({
      action: 'Payroll Upload',
      details: `${period}: ${processed} of ${rows.length} rows posted, ${errors.length} rejected.`,
      actorName: actor,
    });

    res.json({ message: `Payroll for ${period} uploaded.`, processed, total: rows.length, errors, notices });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
