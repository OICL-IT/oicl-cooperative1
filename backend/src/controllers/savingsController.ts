import { Savings } from '../models/Savings.js';

const isMockMode = () => !process.env.MONGODB_URI;

export const getMySavings = async (req: any, res: any) => {
  try {
    if (isMockMode()) {
      return res.json([
        { _id: '1', amount: 50000, type: 'thrift', period: '2025-01', timestamp: new Date().toISOString() }
      ]);
    }
    
    const savings = await Savings.find({ memberId: req.user.id }).sort({ timestamp: -1 });
    res.json(savings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
