import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['annual_general', 'special_general'], required: true },
  scheduledAt: { type: Date, required: true },
  noticeIssuedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  registeredActiveMembers: { type: Number, required: true },
  quorumRequired: { type: Number, required: true },
  attendeesCount: { type: Number, default: 0 },
  minutes: { type: String },
  createdBy: { type: String, required: true },
}, { timestamps: true });

const specialLevySchema = new mongoose.Schema({
  title: { type: String, required: true },
  purpose: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  generalMeetingApproved: { type: Boolean, required: true },
  approvedAt: { type: Date, required: true },
  effectiveAt: { type: Date, required: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const Meeting = mongoose.model('Meeting', meetingSchema);
export const SpecialLevy = mongoose.model('SpecialLevy', specialLevySchema);
