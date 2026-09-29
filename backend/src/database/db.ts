import mongoose from 'mongoose';
import { Member } from '../models/Member.js';
import { LoanCategory } from '../models/Loan.js';
import { SOP_LOAN_PRODUCTS, SOP_RULES } from '../config/sop.js';

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB successfully');

      // Bring legacy records forward without overwriting existing member choices.
      await Member.updateMany({ status: 'pending' }, { $set: { status: 'pending_review' } });
      await Member.updateMany(
        { $or: [{ companyName: { $exists: false } }, { companyName: '' }] },
        { $set: { companyName: 'OICL' } }
      );
      await Member.updateMany(
        { $or: [{ monthlyContribution: { $exists: false } }, { monthlyContribution: { $lt: SOP_RULES.minimumMonthlyContribution } }] },
        { $set: { monthlyContribution: SOP_RULES.minimumMonthlyContribution } }
      );
      await Member.updateMany(
        { status: 'active', dateJoined: { $exists: false } },
        [{ $set: { dateJoined: { $ifNull: ['$createdAt', new Date()] } } }],
        { updatePipeline: true }
      );
      
      // Auto-seed admin if database is new
      const adminExists = await Member.findOne({ role: 'admin' });
      if (!adminExists) {
        await Member.create({
          staffId: 'OICL-ADMIN-01',
          fullName: 'System Administrator',
          email: 'admin@oduainvest.com.ng',
          password: 'password123',
          department: 'Corporate Strategy',
          role: 'admin',
          status: 'active',
          companyName: 'OICL',
          dateJoined: new Date(),
          membershipNumber: 'CICS-ADMIN-0001',
          monthlyContribution: SOP_RULES.minimumMonthlyContribution,
        });
        console.log('Seed: Initial Admin created (admin@oduainvest.com.ng / password123)');
      }

      // Auto-seed Loan Categories
      const productCodes = SOP_LOAN_PRODUCTS.map(product => product.code);
      await LoanCategory.updateMany({ code: { $nin: productCodes } }, { $set: { status: 'inactive' } });
      for (const product of SOP_LOAN_PRODUCTS) {
        await LoanCategory.updateOne(
          { code: product.code },
          {
            $set: {
              ...product,
              minSavingsMultiplier: SOP_RULES.maximumLoanSavingsMultiplier,
              requiredGuarantors: 0,
              status: 'active',
            }
          },
          { upsert: true }
        );
      }
      console.log('Seed: SOP loan categories synchronized');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  } else {
    console.warn('MONGODB_URI not found. Application running in mock-mode for Database operations.');
  }
};
