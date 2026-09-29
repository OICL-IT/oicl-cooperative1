import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { Wallet, Landmark, ShieldCheck, Filter, FileText } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/lib/api';

export const Savings: React.FC = () => {
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const u = api.auth.getUser();
      setMember(u);
      const history = await api.savings.getHistory();
      setTransactions(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ordinarySavings = transactions.filter(item => ['ordinary', 'thrift'].includes(item.type)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const targetSavings = transactions.filter(item => item.type === 'target').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const developmentLevies = transactions.filter(item => item.type === 'development_levy').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Savings & Contributions</h1>
          <p className="page-subtitle">Salary-deducted ordinary savings, target savings, and annual development levies.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ordinary Savings" value={formatCurrency(ordinarySavings || member?.totalSavings || 0)} icon={Wallet} />
        <StatCard title="Target Savings" value={formatCurrency(targetSavings)} icon={Landmark} />
        <StatCard title="Development Levies" value={formatCurrency(developmentLevies)} icon={ShieldCheck} />
        <StatCard title="Monthly Minimum" value={formatCurrency(member?.monthlyContribution || 8000)} icon={Wallet} />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Transaction History</h3>
          <button className="flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline">
            <FileText className="w-3 h-3" />
            Statement of Account
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Period</th>
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Recorded By</th>
                <th className="px-8 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">Loading ledger entries...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">No savings history found for your account</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id || txn.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                    <td className="px-8 py-5 text-xs font-bold text-slate-800 tracking-tight">{txn.period}</td>
                    <td className="px-8 py-5 text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{(txn._id || txn.id)?.slice(-8)}</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium capitalize",
                        txn.type === 'thrift' ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-900"
                      )}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-bold italic">{txn.postedBy}</td>
                    <td className="px-8 py-5 text-sm font-bold text-right financial-data text-emerald-600">+{formatCurrency(txn.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
