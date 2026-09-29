import { EmployeeMaster } from '../models/EmployeeMaster.js';
import { Member } from '../models/Member.js';

/**
 * Verifies if a staff member exists in the master record and is eligible for membership
 */
export const verifyStaff = async (req: any, res: any) => {
  const email = req.body.officialEmail?.toLowerCase().trim();

  try {
    // Run checks in parallel to reduce latency
    const [employee, existingMember] = await Promise.all([
      EmployeeMaster.findOne({ 
        officialEmail: email
      }),
      Member.findOne({ 
        email: email
      })
    ]);

    if (!employee) {
      return res.status(404).json({ 
        error: 'Identity verification failed. Please ensure your details match your HR records.' 
      });
    }

    // 2. Check employment status
    if (employee.employmentStatus !== 'active') {
      return res.status(403).json({ error: 'Membership activation is only available for active staff.' });
    }

    if (existingMember) {
      return res.status(400).json({ error: 'This staff record is already registered as a member.' });
    }

    // If all checks pass, return employee info (excluding sensitive metadata)
    res.json({ message: 'Identity verified successfully', employee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkApplicationStatus = async (req: any, res: any) => {
  const email = req.body.officialEmail?.toLowerCase().trim();
  try {
    const member = await Member.findOne({ email }).select('fullName status reviewDueAt approvedAt membershipNumber');
    if (!member) return res.status(404).json({ error: 'No membership application was found for this email.' });
    res.json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
