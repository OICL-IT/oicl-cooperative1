import React from 'react';
import { X, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface Props {
  loan: any;
  onClose: () => void;
}

export const LoanScheduleModal: React.FC<Props> = ({ loan, onClose }) => {
  if (!loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Repayment Schedule</h2>
            <p className="text-xs text-slate-500">Ref: {loan._id?.slice(-8).toUpperCase()} • {loan.category?.name || loan.categoryName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Principal</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(loan.principal)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Interest Rate</p>
              <p className="text-lg font-black text-slate-900">{loan.interestRate}% <span className="text-[10px] text-slate-400 font-bold uppercase">p.a</span></p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Monthly Deduction</p>
              <p className="text-lg font-black text-emerald-900">{formatCurrency(loan.monthlyDeduction)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-4">Instalment</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Principal</th>
                  <th className="px-6 py-4">Interest</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loan.repaymentSchedule?.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-slate-400">#{i + 1}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatCurrency(item.principalAmount)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatCurrency(item.interestAmount)}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                        item.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status Tracking */}
          <div className="mt-8 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Administrative Status History</h3>
            <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {loan.statusHistory?.map((entry: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={cn(
                    "w-9 h-9 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10",
                    entry.status === 'active' ? "bg-emerald-500" : "bg-slate-200"
                  )}>
                    {entry.status === 'active' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Calendar className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{entry.status.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      {new Date(entry.timestamp).toLocaleString()} • Updated by: {entry.updatedBy}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{entry.comment || 'No comment provided'}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          <button 
            onClick={onClose}
            className="w-full rounded-lg bg-emerald-900 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-950"
          >
            Close Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
};
