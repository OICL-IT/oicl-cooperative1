import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  HandCoins,
  ShieldCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';

export const AdminLoans: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [categories, setCategories] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [loansData, catsData] = await Promise.all([
        api.fetch('/admin/loans'),
        api.loans.getCategories()
      ]);
      setLoans(loansData);
      setCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (loanId: string, status: string) => {
    const comment = prompt(`Enter a comment for this ${status} action:`);
    if (comment === null) return;

    try {
      await api.loans.updateStatus(loanId, status, comment);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const stats = {
    pending: loans.filter(l => ['pending', 'awaiting_guarantors', 'awaiting_approval'].includes(l.status)).length,
    active: loans.filter(l => l.status === 'active').length,
    delinquent: loans.filter(l => l.status === 'defaulted').length,
  };

  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.memberName.toLowerCase().includes(search.toLowerCase()) || 
                         l.staffId.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'pending') return matchesSearch && ['pending', 'awaiting_guarantors', 'awaiting_approval'].includes(l.status);
    if (activeTab === 'active') return matchesSearch && l.status === 'active';
    if (activeTab === 'history') return matchesSearch && ['repaid', 'rejected', 'defaulted'].includes(l.status);
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loan Control Center</h1>
          <p className="text-slate-500 text-sm">Oversee all society credit operations, approvals, and product performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending Applications" value={stats.pending.toString()} icon={Clock} className="border-l-4 border-l-amber-500" />
        <StatCard title="Active Portfolio" value={stats.active.toString()} icon={ShieldCheck} />
        <StatCard title="Delinquent Accounts" value={stats.delinquent.toString()} icon={AlertTriangle} className="text-rose-600" />
      </div>

      <div className="surface overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['pending', 'active', 'history', 'categories'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors",
                  activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab !== 'categories' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search member name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-800 sm:w-72"
              />
            </div>
          )}
        </div>

        {activeTab === 'categories' ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat._id} className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-slate-900">{cat.name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight",
                    cat.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  )}>
                    {cat.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Interest Rate</span>
                    <span className="text-slate-900">{cat.interestRate}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Max Tenure</span>
                    <span className="text-slate-900">{cat.maxTenure} Months</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Multiplier</span>
                    <span className="text-slate-900">{cat.minSavingsMultiplier}x Savings</span>
                  </div>
                </div>
                <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">
                  Modify Product
                </button>
              </div>
            ))}
            <button className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 p-8 text-slate-600 transition-colors hover:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-900">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Add New Loan Category</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-5">Applicant & Staff ID</th>
                  <th className="px-8 py-5">Loan Details</th>
                  <th className="px-8 py-5">Repayment Term</th>
                  <th className="px-8 py-5">Status History</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">Accessing credit registry...</td></tr>
                ) : filteredLoans.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No matching applications in this queue</td></tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px] text-slate-400 uppercase">
                            {loan.memberName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{loan.memberName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loan.staffId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800">{formatCurrency(loan.principal)}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">{loan.category.name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-600">{loan.tenure} Months</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Deduction: {formatCurrency(loan.monthlyDeduction)}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight shadow-sm",
                            loan.status === 'active' ? "bg-emerald-100 text-emerald-900" :
                            ['rejected', 'defaulted'].includes(loan.status) ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {loan.status.replace('_', ' ')}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {loan.status === 'awaiting_approval' ? (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleStatusUpdate(loan._id, 'active')}
                              className="rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-950"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(loan._id, 'rejected')}
                              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
