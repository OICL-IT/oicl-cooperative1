import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ordinary', 'target', 'agm_levy', 'development_levy', 'loan_repayment', 'thrift', 'shares', 'welfare', 'emergency'], required: true },
  period: { type: String, required: true }, // Format: YYYY-MM
  timestamp: { type: Date, default: Date.now },
  postedBy: { type: String, default: 'SYSTEM' }
}, { timestamps: true });

savingsSchema.index({ memberId: 1, type: 1, period: 1 }, { unique: true });

export const Savings = mongoose.model('Savings', savingsSchema);

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, required: true },
  actorName: { type: String, required: true },
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
