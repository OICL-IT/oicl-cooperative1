import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  payrollNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  officialEmail: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true, index: true },
  department: { type: String, required: true },
  gradeLevel: { type: String },
  branch: { type: String },
  employmentStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  dateOfEmployment: { type: Date },
  staffCategory: { type: String },
  companyName: { type: String, default: 'OICL' },
  jobTitle: { type: String },
  monthlyNetPay: { type: Number, min: 0 },
  monthlyStatutoryDeductions: { type: Number, min: 0, default: 0 },
  importedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Index for search optimization
employeeSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text', department: 'text' });

export const EmployeeMaster = mongoose.model('EmployeeMaster', employeeSchema, 'employees_master');
