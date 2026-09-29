import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { HandCoins, Landmark, AlertCircle, CheckCircle2, Plus, Clock } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { LoanApplicationModal } from '@/components/LoanApplicationModal';
import { LoanScheduleModal } from '@/components/LoanScheduleModal';

export const Loans: React.FC = () => {
  const [member, setMember] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<any>(null);

  const fetchData = async () => {
    try {
      const u = api.auth.getUser();
      setMember(u);
      const data = await api.loans.getMyLoans();
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
  const creditLimit = (member?.totalSavings || 0) * 3;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Loan Management</h1>
          <p className="page-subtitle">Apply for loans and track your active repayment schedules.</p>
        </div>
        <button 
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950"
        >
          <Plus className="w-4 h-4" />
          Apply for New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Loan Outstanding" value={formatCurrency(totalOutstanding)} icon={HandCoins} />
        <StatCard title="Active Repayments" value={`${activeLoans.length} Account${activeLoans.length !== 1 ? 's' : ''}`} icon={Landmark} />
        <StatCard title="Credit Limit" value={formatCurrency(creditLimit)} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="surface p-5 sm:p-6">
            <h3 className="mb-5 text-base font-semibold text-slate-900">Your loan accounts</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold italic">Checking loan registry...</div>
              ) : loans.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-20" />
                  <p className="text-slate-400 font-bold italic">Your credit record is clear. No active loans found.</p>
                </div>
              ) : (
                loans.map((loan, i) => {
                  const progress = Math.round(((loan.principal - (loan.balance || 0)) / loan.principal) * 100);
                  return (
                    <div key={i} className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-slate-300">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-slate-900">{loan.categoryName}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                              loan.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {loan.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {loan.id?.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xl font-semibold text-slate-900 financial-data">{formatCurrency(loan.balance || 0)}</p>
                          <p className="text-xs text-slate-500">Outstanding</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-600">Repayment progress</span>
                          <span className="text-emerald-800">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-800 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-600">Created: {loan.createdAt && new Date(loan.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedLoanForSchedule(loan)}
                          className="text-sm font-medium text-emerald-800 hover:underline"
                        >
                          View Schedule
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <LoanApplicationModal 
          isOpen={isApplyModalOpen} 
          onClose={() => setIsApplyModalOpen(false)} 
          onSuccess={fetchData}
        />
        {selectedLoanForSchedule && (
          <LoanScheduleModal 
            loan={selectedLoanForSchedule} 
            onClose={() => setSelectedLoanForSchedule(null)} 
          />
        )}

        <div className="space-y-6">
          <div className="surface border-l-4 border-l-emerald-800 p-6">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Quick loan eligibility</h3>
            <p className="text-sm leading-6 text-slate-600">Based on your current savings and share capital, you are eligible for up to:</p>
            <div className="my-6">
              <h2 className="text-2xl font-semibold text-slate-900 financial-data">{formatCurrency(creditLimit)}</h2>
              <p className="mt-1 text-xs text-slate-500">Maximum credit facility</p>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'Savings Multiplier: 3x',
                'Guarantors Required: 2',
                'Interest Rate: 4% per annum',
                'Max Tenure: 60 months'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="w-full rounded-lg bg-emerald-900 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-950">
              Open Loan Calculator
            </button>
          </div>

          <div className="surface p-6">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Technical assistance</h3>
            <p className="mb-5 text-sm leading-6 text-slate-600">Our cooperative officers are available to assist with loan restructuring or emergency applications.</p>
            <button className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              Chat with Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
