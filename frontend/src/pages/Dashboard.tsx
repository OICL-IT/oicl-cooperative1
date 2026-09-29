import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/StatCard';
import { Wallet, HandCoins, Users, TrendingUp, Clock, Landmark, UserCog, FileText, PiggyBank, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const user = api.auth.getUser();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  
  const [metrics, setMetrics] = useState({
    totalSavings: 0,
    activeLoans: 0,
    activeMembers: 0,
    pendingApprovals: 0
  });
  const [userLoanSummary, setUserLoanSummary] = useState({
    totalOutstanding: 0,
    activeCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const data = await api.admin.getSummary();
          setMetrics({
            totalSavings: data.totalSavings,
            activeLoans: data.activePortfolio,
            activeMembers: data.activeMembers,
            pendingApprovals: data.pendingApprovals
          });
        } else {
          const myLoans = await api.loans.getMyLoans();
          const active = myLoans.filter((l: any) => l.status === 'active');
          setUserLoanSummary({
            totalOutstanding: active.reduce((sum: number, l: any) => sum + l.balance, 0),
            activeCount: active.length
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (loading && isAdmin) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating Enterprise Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Welcome Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div>
            <p className="mb-1 text-sm font-medium text-emerald-800">{isAdmin ? 'Cooperative at a glance' : 'Your financial overview'}</p>
            <h1 className="page-title">
              Good day, {user?.fullName?.split(' ')[0] || 'Member'}
            </h1>
            <p className="page-subtitle">
              Member ID: <span className="font-bold text-slate-700">{user?.staffId || 'Pending'}</span> <span className="mx-1 text-slate-300">•</span> {user?.department || 'OICL Cooperative'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/financial-status')} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950">
            <TrendingUp className="w-4 h-4" />
            Generate Global Report
          </button>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin ? (
          <>
            <StatCard 
              title="Total Society Savings" 
              value={formatCurrency(metrics.totalSavings ?? 0)} 
              icon={Wallet}
            />
            <StatCard 
              title="Active Loan Portfolio" 
              value={formatCurrency(metrics.activeLoans ?? 0)} 
              icon={HandCoins}
            />
            <StatCard 
              title="Active Member Registry" 
              value={metrics.activeMembers ?? 0} 
              icon={Users}
            />
            <StatCard 
              title="Pending Approvals" 
              value={metrics.pendingApprovals ?? 0} 
              icon={Clock}
            />
          </>
        ) : (
          <>
            <StatCard 
              title="Your Net Savings" 
              value={formatCurrency(user?.totalSavings || 0)} 
              icon={Wallet}
            />
            <StatCard 
              title="Loan Indebtedness" 
              value={formatCurrency(userLoanSummary.totalOutstanding)} 
              icon={HandCoins}
              className={cn(userLoanSummary.totalOutstanding > 0 ? "border-l-4 border-l-amber-600" : "")}
            />
            <StatCard 
              title="Share Capital" 
              value={formatCurrency(user?.shareCapital || 0)} 
              icon={Landmark}
            />
            <StatCard 
              title="Welfare Scheme" 
              value={formatCurrency(user?.welfareBalance || 0)} 
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Quick Actions Panel (Common) */}
          <div className="surface p-5 sm:p-7">
            <div className="mb-5"><h3 className="text-base font-extrabold text-slate-950">Quick actions</h3><p className="mt-1 text-xs text-slate-500">Jump straight into your most common tasks.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(isAdmin ? [
                { label: 'Staff directory', icon: UserCog, path: '/admin/staff', help: 'Manage employee records' },
                { label: 'Members', icon: Users, path: '/members', help: 'Review the member registry' },
                { label: 'Loan control', icon: HandCoins, path: '/admin/loans', help: 'Review loan applications' },
              ] : [
                { label: 'Apply for a loan', icon: HandCoins, path: '/loans', help: 'Explore your credit options' },
                { label: 'View savings', icon: PiggyBank, path: '/savings', help: 'Track contributions' },
                { label: 'Statements', icon: FileText, path: '/financial-status', help: 'Review your financial status' },
              ]).map((act, i) => (
                <button 
                  key={i} 
                  onClick={() => act.path !== '#' && navigate(act.path)}
                  className="group relative flex items-start gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-800/40 hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-emerald-900"><act.icon className="h-4.5 w-4.5" /></span>
                  <span className="min-w-0"><span className="block text-sm font-medium text-slate-900">{act.label}</span><span className="mt-1 block text-xs leading-4 text-slate-600">{act.help}</span></span>
                  <ArrowRight className="absolute right-3 top-3 h-3.5 w-3.5 -translate-x-1 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-800 bg-white p-6 sm:p-7">
              <div className="max-w-sm">
                <h2 className="mb-2 text-base font-semibold text-slate-900">OICL Cooperative Merit Scheme</h2>
                <p className="mb-5 text-sm leading-6 text-slate-600">
                  You are currently eligible for {formatCurrency((user?.totalSavings || 0) * 3)} in soft loans based on your savings multiplier (3x).
                </p>
                <button 
                  onClick={() => window.location.href = '/loans'}
                  className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950"
                >
                  Apply Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Status / Info */}
        <div className="space-y-6">
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-semibold text-slate-900">Compliance status</h3>
              <div className="h-2 w-2 rounded-full bg-emerald-700"></div>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Society Membership', status: 'Verified', color: 'text-emerald-800' },
                { label: 'KYC Documentation', status: 'Complete', color: 'text-emerald-800' },
                { label: 'Deduction Mandate', status: 'Active', color: 'text-emerald-800' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className={cn("text-xs font-medium", item.color)}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ShieldCheck className="mb-3 h-5 w-5 text-emerald-800" />
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Need assistance?</h4>
            <p className="mb-4 text-sm leading-5 text-slate-600">
              Contact the Cooperative Admin unit for manual adjustments or loan restructuring.
            </p>
            <button className="text-sm font-medium text-emerald-800 underline underline-offset-4 hover:text-emerald-950">
              Helpdesk Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
