import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Member } from '../models/Member.js';
import { EmployeeMaster } from '../models/EmployeeMaster.js';
import { SOP_RULES, addWorkingDays } from '../config/sop.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const isMockMode = () => !process.env.MONGODB_URI;
const areMembershipRefereesRequired = () => process.env.REQUIRE_MEMBERSHIP_REFEREES === 'true';
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_RESPONSE = 'If an account exists for that email, a password reset link has been sent.';

const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeStaffId = (staffId: unknown) => String(staffId ?? '').trim().toUpperCase();

const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const message = {
    from,
    to: email,
    subject: 'Reset your OICL Cooperative password',
    text: `A password reset was requested for your OICL Cooperative account. Reset your password: ${resetUrl}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`,
    html: `<p>A password reset was requested for your OICL Cooperative account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour. If you did not request it, you can ignore this email.</p>`,
  };

  if (apiKey && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...message, to: [email] }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend delivery failed (${response.status}): ${details}`);
    }
    return;
  }

  if (smtpHost && smtpUser && smtpPass && from) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail(message);
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Password reset email is not configured.');
  }
  console.info(`Development password reset link for ${email}: ${resetUrl}`);
};

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    if (isMockMode()) {
      // Mock Login for Dev if No Mongo
      if (email === 'admin@oduainvest.com.ng' && password === 'password123') {
        const token = jwt.sign({ id: 'mock-admin', role: 'admin' }, JWT_SECRET);
        return res.json({ token, user: { fullName: 'Mock Admin', role: 'admin', email } });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const member = await Member.findOne({ email });
    if (!member || !(await (member as any).comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (member.status !== 'active') {
      const statusMessages: Record<string, string> = {
        pending_review: 'Your membership application is awaiting EXCO review.',
        approved_pending_activation: 'Your application is approved and awaiting registration-fee confirmation and activation.',
        rejected: 'Your membership application was not approved. Please contact the Secretariat.',
        resigned: 'This membership has been resigned.',
        terminated: 'This membership has been terminated.',
      };
      return res.status(403).json({ error: statusMessages[member.status] || 'This membership is not active.' });
    }
    const token = jwt.sign({ id: member._id, role: member.role }, JWT_SECRET);
    res.json({ token, user: member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req: any, res: any) => {
  const {
    employeeId, firstName, lastName, officialEmail, phoneNumber, department, password,
    companyName, position, dateOfBirth, gender, residentialAddress,
    nextOfKinName, nextOfKinRelationship, nextOfKinPhone,
    bankName, accountName, accountNumber, monthlyContribution, targetSavingsContribution,
    refereeStaffId1, refereeStaffId2, validId, passportPhoto, declarationAccepted,
  } = req.body;

  try {
    if (isMockMode()) {
      return res.status(400).json({ error: 'Registration is disabled in mock mode. Please connect to MongoDB.' });
    }

    // 1. Verify identity against HR Master Records
    const employee = await EmployeeMaster.findOne({
      employeeId,
      officialEmail: officialEmail.toLowerCase(),
      employmentStatus: 'active'
    });

    if (!employee) {
      return res.status(404).json({ error: 'HR record verification failed. Ensure details match your employee profile.' });
    }

    // 2. Check for duplicate membership
    const existing = await Member.findOne({ 
      $or: [{ staffId: employeeId }, { email: officialEmail.toLowerCase() }] 
    });
    
    if (existing) {
      return res.status(400).json({ error: 'A member account already exists for this staff record.' });
    }

    let referees: any[] = [];
    if (areMembershipRefereesRequired()) {
      const refereeStaffIds = [refereeStaffId1, refereeStaffId2].map(normalizeStaffId);
      referees = await Member.find({
        status: 'active',
        $expr: {
          $in: [
            { $toUpper: { $trim: { input: '$staffId' } } },
            refereeStaffIds,
          ],
        },
      });

      const matchedStaffIds = new Set(referees.map(referee => normalizeStaffId(referee.staffId)));
      const invalidRefereeStaffIds = refereeStaffIds.filter(staffId => !matchedStaffIds.has(staffId));
      if (invalidRefereeStaffIds.length > 0) {
        return res.status(400).json({
          error: `The following referee staff ID${invalidRefereeStaffIds.length > 1 ? 's are' : ' is'} not associated with a current active Society member: ${invalidRefereeStaffIds.join(', ')}.`,
        });
      }
    }

    const submittedAt = new Date();

    // Create a pending application. EXCO approval and fee confirmation activate membership.
    const member = await Member.create({
      staffId: employeeId,
      fullName: `${firstName} ${lastName}`,
      email: officialEmail.toLowerCase(),
      department,
      companyName,
      position,
      dateOfBirth,
      gender,
      phoneNumber,
      residentialAddress,
      nextOfKin: { name: nextOfKinName, relationship: nextOfKinRelationship, phone: nextOfKinPhone },
      bank: { name: bankName, accountName, accountNumber },
      monthlyContribution: Number(monthlyContribution),
      targetSavingsContribution: Number(targetSavingsContribution || 0),
      monthlyNetPay: Number(employee.monthlyNetPay || 0),
      monthlyStatutoryDeductions: Number(employee.monthlyStatutoryDeductions || 0),
      referees: referees.map(referee => ({
        memberId: referee._id,
        staffId: referee.staffId,
        fullName: referee.fullName,
        companyName: referee.companyName,
      })),
      documents: { validId, passportPhoto },
      declarationAccepted,
      password,
      role: 'member',
      status: 'pending_review',
      registrationFee: { amount: SOP_RULES.registrationFee, paid: false },
      applicationSubmittedAt: submittedAt,
      reviewDueAt: addWorkingDays(submittedAt, SOP_RULES.membershipReviewWorkingDays),
    });

    res.status(201).json({
      message: 'Membership application submitted for EXCO review. A decision is due within 3 working days.',
      memberId: (member as any)._id,
      status: member.status,
      reviewDueAt: member.reviewDueAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPassword = async (req: any, res: any) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    if (isMockMode()) return res.json({ message: PASSWORD_RESET_RESPONSE });

    const member = await Member.findOne({ email });
    if (!member) return res.json({ message: PASSWORD_RESET_RESPONSE });

    const token = crypto.randomBytes(32).toString('hex');
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    member.set({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });
    await member.save();

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (error) {
      member.set({ passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined });
      await member.save();
      throw error;
    }

    res.json({
      message: PASSWORD_RESET_RESPONSE,
      ...(process.env.NODE_ENV !== 'production' ? { developmentResetUrl: resetUrl } : {}),
    });
  } catch (err: any) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Unable to process the password reset request. Please try again later.' });
  }
};

export const resetPassword = async (req: any, res: any) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (!token || password.length < 8) {
    return res.status(400).json({ error: 'A valid reset token and a password of at least 8 characters are required.' });
  }

  try {
    if (isMockMode()) return res.status(400).json({ error: 'Password reset is unavailable in mock mode.' });

    const member = await Member.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!member) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    member.password = password;
    member.set({ passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined });
    await member.save();
    res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Unable to reset the password. Please try again later.' });
  }
};

export const getMe = async (req: any, res: any) => {
  try {
    if (isMockMode()) return res.json({ fullName: 'Mock User', role: req.user.role });
    const member = await Member.findById(req.user.id);
    res.json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
