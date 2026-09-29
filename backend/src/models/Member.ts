import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SOP_RULES } from '../config/sop.js';

const memberSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  department: { type: String, required: true },
  companyName: { type: String, required: true, default: 'OICL' },
  position: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female'] },
  phoneNumber: { type: String },
  residentialAddress: { type: String },
  nextOfKin: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
  },
  bank: {
    name: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
  },
  referees: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    staffId: { type: String },
    fullName: { type: String },
    companyName: { type: String },
  }],
  documents: {
    validId: { fileName: String, mimeType: String, data: String },
    passportPhoto: { fileName: String, mimeType: String, data: String },
  },
  declarationAccepted: { type: Boolean, default: false },
  role: { type: String, enum: ['member', 'admin', 'treasurer', 'president', 'auditor'], default: 'member' },
  status: {
    type: String,
    enum: ['pending_review', 'approved_pending_activation', 'active', 'resigned', 'terminated', 'rejected', 'retired'],
    default: 'pending_review'
  },
  membershipNumber: { type: String, unique: true, sparse: true },
  applicationSubmittedAt: { type: Date },
  reviewDueAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  welcomeLetterIssuedAt: { type: Date },
  registrationFee: {
    amount: { type: Number, default: SOP_RULES.registrationFee },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  monthlyContribution: { type: Number, default: SOP_RULES.minimumMonthlyContribution, min: SOP_RULES.minimumMonthlyContribution },
  targetSavingsContribution: { type: Number, default: 0, min: 0 },
  monthlyNetPay: { type: Number, default: 0, min: 0 },
  monthlyStatutoryDeductions: { type: Number, default: 0, min: 0 },
  totalSavings: { type: Number, default: 0 },
  shareCapital: { type: Number, default: 0 },
  welfareBalance: { type: Number, default: 0 },
  financialRemarks: { type: String, default: '' },
  dateJoined: { type: Date },
}, { timestamps: true });

memberSchema.pre('save', async function(this: any) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

memberSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Member = mongoose.model('Member', memberSchema);
