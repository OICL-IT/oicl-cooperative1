/**
 * Middleware to validate registration request body
 */
export const validateRegister = (req: any, res: any, next: any) => {
  const { officialEmail } = req.body;
  const normalizeStaffId = (staffId: unknown) => String(staffId ?? '').trim().toUpperCase();
  const refereesRequired = process.env.REQUIRE_MEMBERSHIP_REFEREES === 'true';

  const requiredFields = [
    'employeeId',
    'firstName',
    'lastName',
    'officialEmail',
    'phoneNumber',
    'department',
    'password',
    'companyName',
    'position',
    'dateOfBirth',
    'gender',
    'residentialAddress',
    'nextOfKinName',
    'nextOfKinRelationship',
    'nextOfKinPhone',
    'bankName',
    'accountName',
    'accountNumber',
    'monthlyContribution',
    'validId',
    'passportPhoto',
  ];

  if (refereesRequired) {
    requiredFields.push('refereeStaffId1', 'refereeStaffId2');
  }

  // Check for missing or empty fields
  const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(officialEmail)) {
    return res.status(400).json({ error: 'Invalid official email format' });
  }

  if (Number(req.body.monthlyContribution) < 8000) {
    return res.status(400).json({ error: 'Monthly ordinary contribution cannot be less than N8,000.' });
  }

  if (refereesRequired && normalizeStaffId(req.body.refereeStaffId1) === normalizeStaffId(req.body.refereeStaffId2)) {
    return res.status(400).json({ error: 'Two different current-member referees are required.' });
  }

  if (req.body.declarationAccepted !== true) {
    return res.status(400).json({ error: 'You must accept the membership declaration and consent.' });
  }

  next();
};
