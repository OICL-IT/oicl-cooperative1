import { Meeting, SpecialLevy } from '../models/Governance.js';
import { Member } from '../models/Member.js';
import { AuditLog } from '../models/Savings.js';
import { SOP_RULES } from '../config/sop.js';

const isMockMode = () => !process.env.MONGODB_URI;

export const getGovernance = async (_req: any, res: any) => {
  try {
    if (isMockMode()) return res.json({ meetings: [], specialLevies: [], activeMembers: 0, quorumRequired: 0 });
    const [meetings, specialLevies, activeMembers] = await Promise.all([
      Meeting.find({}).sort({ scheduledAt: -1 }),
      SpecialLevy.find({}).sort({ effectiveAt: -1 }),
      Member.countDocuments({ status: 'active' }),
    ]);
    res.json({ meetings, specialLevies, activeMembers, quorumRequired: Math.ceil(activeMembers / 3) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMeeting = async (req: any, res: any) => {
  try {
    const scheduledAt = new Date(req.body.scheduledAt);
    const minimumNoticeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < minimumNoticeAt) {
      return res.status(400).json({ error: 'General meetings require at least 24 hours notice.' });
    }
    const activeMembers = await Member.countDocuments({ status: 'active' });
    const meeting = await Meeting.create({
      title: req.body.title,
      type: req.body.type,
      scheduledAt,
      registeredActiveMembers: activeMembers,
      quorumRequired: Math.ceil(activeMembers / 3),
      createdBy: req.user.role,
    });
    res.status(201).json(meeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const completeMeeting = async (req: any, res: any) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    const attendeesCount = Number(req.body.attendeesCount);
    if (attendeesCount < meeting.quorumRequired) {
      return res.status(400).json({ error: `Quorum not met. At least ${meeting.quorumRequired} active members are required.` });
    }
    meeting.attendeesCount = attendeesCount;
    meeting.minutes = req.body.minutes;
    meeting.status = 'completed';
    await meeting.save();
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSpecialLevy = async (req: any, res: any) => {
  try {
    const approvedAt = new Date(req.body.approvedAt);
    const effectiveAt = new Date(req.body.effectiveAt);
    const minimumEffectiveAt = new Date(approvedAt);
    minimumEffectiveAt.setDate(minimumEffectiveAt.getDate() + SOP_RULES.specialLevyNoticeDays);
    if (!req.body.generalMeetingApproved) return res.status(400).json({ error: 'Special levies require General Meeting approval.' });
    if (Number.isNaN(effectiveAt.getTime()) || effectiveAt < minimumEffectiveAt) {
      return res.status(400).json({ error: 'Members must receive at least 14 days notice of a special levy.' });
    }
    const levy = await SpecialLevy.create({ ...req.body, approvedAt, effectiveAt, createdBy: req.user.role });
    await AuditLog.create({ action: 'Special Levy Created', details: `${levy.title}: N${levy.amount}`, actorName: req.user.role });
    res.status(201).json(levy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
