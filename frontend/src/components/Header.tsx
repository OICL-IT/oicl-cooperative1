import React, { useState, useEffect } from 'react';
import { Bell, Loader2, Menu, ChevronDown, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Header: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [member, setMember] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [panel, setPanel] = useState<'notifications' | 'profile' | null>(null);

  useEffect(() => {
    setMember(api.auth.getUser());
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  const runPayroll = async () => {
    if (!confirm('Are you sure you want to run the payroll deduction batch for the current month?')) return;
    
    setIsRunning(true);
    try {
      const res = await api.admin.processPayroll(new Date().toISOString().slice(0, 7));
      alert(`Success: ${res.message} (${res.processedCount} members processed)`);
    } catch (error) {
      console.error(error);
      alert('Failed to run payroll batch.');
    } finally {
      setIsRunning(false);
    }
  };

  const titles: Record<string, string> = { '/': 'Overview', '/savings': 'Savings', '/loans': 'Loans', '/members': 'Members', '/admin/staff': 'Staff Directory', '/admin/loans': 'Loan Control', '/governance': 'Governance', '/financial-status': 'Financial Status' };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuClick} className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{titles[location.pathname] || 'OICL Cooperative'}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-2 sm:gap-3">
          <button onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className={cn("relative rounded-md p-2 transition-colors", panel === 'notifications' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100")} aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500"></span>
          </button>

          {member?.role === 'admin' && (
            <button 
              onClick={runPayroll}
              disabled={isRunning}
              className="hidden items-center gap-2 rounded-md bg-emerald-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50 sm:flex"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {isRunning ? 'Processing...' : 'Run Payroll'}
            </button>
          )}

          <button className="flex items-center gap-2 rounded-md p-1.5 pr-2 hover:bg-slate-100" onClick={() => setPanel(panel === 'profile' ? null : 'profile')}>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-900 leading-none">
                {member?.fullName || 'Authenticating...'}
              </p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[11px] capitalize text-slate-500">
                {member?.staffId || 'ADMIN'} · {member?.role || 'user'}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold uppercase text-emerald-900">
              {member?.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'OC'}
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
          </button>
          {panel && <div className="absolute right-0 top-12 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {panel === 'notifications' ? <div className="p-3"><div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-800"/><p className="text-sm font-medium text-slate-900">You’re all caught up</p></div><p className="text-sm leading-5 text-slate-600">New cooperative updates and approvals will appear here.</p></div> : <><div className="border-b border-slate-100 p-3"><p className="text-sm font-medium text-slate-900">{member?.fullName}</p><p className="mt-0.5 text-xs text-slate-500">{member?.email}</p></div><button onClick={handleLogout} className="mt-1 w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50">Sign out</button></>}
          </div>}
      </div>
    </header>
  );
};
