import mongoose from 'mongoose';

const payrollPeriodControlSchema = new mongoose.Schema({
  period: { type: String, required: true, unique: true },
  locked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: String },
  unlockedAt: { type: Date },
  unlockedBy: { type: String },
  note: { type: String, default: '' },
}, { timestamps: true });

export const PayrollPeriodControl = mongoose.model('PayrollPeriodControl', payrollPeriodControlSchema);
