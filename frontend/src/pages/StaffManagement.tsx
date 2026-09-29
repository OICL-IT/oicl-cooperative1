import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EmployeeMaster } from '@/types';
import { Search, Upload, UserPlus, Filter, ShieldCheck, ShieldAlert, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<EmployeeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    payrollNumber: '',
    firstName: '',
    lastName: '',
    officialEmail: '',
    phoneNumber: '',
    department: '',
    monthlyNetPay: 0,
    monthlyStatutoryDeductions: 0,
    employmentStatus: 'active' as const
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const data = await api.admin.getStaff();
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['EmployeeId', 'PayrollNumber', 'FirstName', 'LastName', 'OfficialEmail', 'PhoneNumber', 'Department', 'MonthlyNetPay', 'MonthlyStatutoryDeductions'];
    const sampleData = ['OICL/STF/001', 'PRL9901', 'John', 'Doe', 'j.doe@oduainvest.com.ng', '08012345678', 'Information Technology', '350000', '45000'];
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oicl_staff_template.csv';
    a.click();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header
      
      const parsedEmployees = rows.filter(row => row.trim()).map(row => {
        const cols = row.split(',');
        return {
          employeeId: cols[0]?.trim(),
          payrollNumber: cols[1]?.trim(),
          firstName: cols[2]?.trim(),
          lastName: cols[3]?.trim(),
          officialEmail: cols[4]?.trim(),
          phoneNumber: cols[5]?.trim(),
          department: cols[6]?.trim(),
          monthlyNetPay: Number(cols[7]?.trim() || 0),
          monthlyStatutoryDeductions: Number(cols[8]?.trim() || 0),
          employmentStatus: 'active'
        };
      });

      try {
        await api.admin.importStaff(parsedEmployees);
        alert('Bulk import completed successfully');
        loadStaff();
      } catch (err) {
        alert('Error importing staff. Check CSV format.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const toggleStatus = async (employee: EmployeeMaster) => {
    const newStatus = employee.employmentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.admin.updateStaff(employee._id!, { employmentStatus: newStatus });
      loadStaff();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredStaff = staff.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const searchLower = search.toLowerCase();
    return fullName.includes(searchLower) || 
           s.employeeId?.toLowerCase().includes(searchLower) ||
           s.officialEmail?.toLowerCase().includes(searchLower);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsImporting(true);
      // Reuse the import logic for a single staff member
      await api.admin.importStaff([formData]);
      alert('Staff record saved successfully');
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        payrollNumber: '',
        firstName: '',
        lastName: '',
        officialEmail: '',
        phoneNumber: '',
        department: '',
        monthlyNetPay: 0,
        monthlyStatutoryDeductions: 0,
        employmentStatus: 'active'
      });
      loadStaff();
    } catch (err) {
      alert('Error saving staff record');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Staff management</h1>
          <p className="page-subtitle">Manage the enterprise master employee records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Get Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Upload CSV'}
            <input type="file" accept=".csv" hidden onChange={handleCsvUpload} disabled={isImporting} />
          </label>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950"
          >
            <UserPlus className="w-4 h-4" />
            Add Single Staff
          </button>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Email..." 
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em] border-b border-slate-100">
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold animate-pulse">Loading employee master...</td></tr>
              ) : filteredStaff.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-black text-slate-900 font-mono">{emp.employeeId}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{emp.firstName} {emp.lastName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{emp.officialEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-tight">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium capitalize",
                      emp.employmentStatus === 'active' ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-700"
                    )}>{emp.employmentStatus}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(emp)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        emp.employmentStatus === 'active' ? "hover:bg-rose-50 text-rose-400" : "hover:bg-emerald-50 text-emerald-400"
                      )}
                    >
                      {emp.employmentStatus === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add new staff</h2>
                <p className="text-sm text-slate-600">Manual entry</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employee ID</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    placeholder="OICL/STF/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payroll Number</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.payrollNumber}
                    onChange={e => setFormData({...formData, payrollNumber: e.target.value})}
                    placeholder="PRL..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.officialEmail}
                    onChange={e => setFormData({...formData, officialEmail: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Monthly Net Pay</label>
                  <input required type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.monthlyNetPay || ''} onChange={e => setFormData({...formData, monthlyNetPay: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Statutory Deductions</label>
                  <input required type="number" min="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.monthlyStatutoryDeductions} onChange={e => setFormData({...formData, monthlyStatutoryDeductions: Number(e.target.value)})} />
                </div>
              </div>
              <button 
                disabled={isImporting}
                className="w-full rounded-lg bg-emerald-900 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50"
              >
                {isImporting ? 'Processing...' : 'Save Staff Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
