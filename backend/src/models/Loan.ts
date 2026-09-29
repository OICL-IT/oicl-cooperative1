import mongoose from 'mongoose';

const loanCategorySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  interestRate: { type: Number, required: true },
  interestMethod: { type: String, enum: ['reducing', 'flat'], required: true },
  maxTenure: { type: Number, required: true }, // in months
  minSavingsMultiplier: { type: Number, default: 2 },
  requiredGuarantors: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const LoanCategory = mongoose.model('LoanCategory', loanCategorySchema);

const loanSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String, required: true },
  staffId: { type: String, required: true },
  principal: { type: Number, required: true },
  balance: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenure: { type: Number, required: true }, // in months
  monthlyDeduction: { type: Number, required: true },
  projectedTakeHome: { type: Number, required: true },
  purpose: { type: String },
  status: { type: String, enum: ['pending', 'awaiting_guarantors', 'awaiting_approval', 'active', 'repaid', 'rejected', 'defaulted'], default: 'pending' },
  category: { 
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanCategory' },
    name: { type: String, required: true },
    code: { type: String, required: true },
    interestMethod: { type: String, enum: ['reducing', 'flat'], required: true },
  },
  guarantors: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    fullName: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  repaymentSchedule: [{
    dueDate: { type: Date },
    principalAmount: { type: Number },
    interestAmount: { type: Number },
    totalAmount: { type: Number },
    status: { type: String, enum: ['pending', 'paid', 'late'], default: 'pending' },
    paidDate: { type: Date }
  }],
  statusHistory: [{
    status: { type: String },
    updatedBy: { type: String },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String }
  }],
  decisionDueAt: { type: Date },
  disbursedAt: { type: Date },
}, { timestamps: true });

export const Loan = mongoose.model('Loan', loanSchema);
