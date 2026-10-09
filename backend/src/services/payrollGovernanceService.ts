import { Savings } from '../models/Savings.js';
import { PayrollPeriodControl } from '../models/PayrollPeriodControl.js';

export type PayrollPeriodStatus = 'not_processed' | 'system_processed' | 'uploaded';

const SYSTEM_PAYROLL_TYPES = ['ordinary', 'target', 'agm_levy', 'development_levy'];

export const getPayrollPeriodStatus = async (period: string) => {
  const [systemGeneratedEntries, uploadedEntries, control] = await Promise.all([
    Savings.countDocuments({ period, postedBy: 'SYSTEM_PAYROLL', type: { $in: SYSTEM_PAYROLL_TYPES } }),
    Savings.countDocuments({ period, postedBy: /^PAYROLL_UPLOAD:/ }),
    PayrollPeriodControl.findOne({ period }).lean(),
  ]);

  const status: PayrollPeriodStatus = uploadedEntries > 0
    ? 'uploaded'
    : systemGeneratedEntries > 0
      ? 'system_processed'
      : 'not_processed';

  return {
    period,
    status,
    systemGeneratedEntries,
    uploadedEntries,
    periodLocked: !!control?.locked,
    lockedAt: control?.lockedAt || null,
    lockedBy: control?.lockedBy || '',
    unlockedAt: control?.unlockedAt || null,
    unlockedBy: control?.unlockedBy || '',
    lockNote: control?.note || '',
    lockAutoPayroll: status === 'uploaded' || !!control?.locked,
  };
};

export const setPayrollPeriodLockState = async (period: string, lock: boolean, actor: string, note = '') => {
  const now = new Date();
  if (lock) {
    return await PayrollPeriodControl.findOneAndUpdate(
      { period },
      {
        $set: {
          period,
          locked: true,
          lockedAt: now,
          lockedBy: actor,
          note: String(note || '').slice(0, 300),
        },
      },
      { upsert: true, new: true }
    ).lean();
  }

  return await PayrollPeriodControl.findOneAndUpdate(
    { period },
    {
      $set: {
        period,
        locked: false,
        unlockedAt: now,
        unlockedBy: actor,
        note: String(note || '').slice(0, 300),
      },
    },
    { upsert: true, new: true }
  ).lean();
};
