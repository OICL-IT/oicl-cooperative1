import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Wallet, 
  HandCoins, 
  LogOut,
  Building2,
  LayoutGrid,
  UserCog,
  FileText,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';

interface SidebarProps {
  currentPath: string;
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    setMember(api.auth.getUser());
  }, []);

  const isAdmin = member?.role === 'admin';
  const canManagePayroll = ['admin', 'president', 'treasurer'].includes(member?.role);
  const canViewReports = ['admin', 'president', 'treasurer', 'auditor'].includes(member?.role);

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/', visible: true },
    { icon: Wallet, label: 'Savings', path: '/savings', visible: true },
    { icon: HandCoins, label: 'Loans', path: '/loans', visible: true },
    { icon: FileText, label: canViewReports ? 'Financial Status' : 'My Statement', path: '/financial-status', visible: true },
    { icon: LayoutGrid, label: 'Loan Control', path: '/admin/loans', visible: isAdmin },
    { icon: UserCog, label: 'Staff Directory', path: '/admin/staff', visible: isAdmin },
    { icon: FileSpreadsheet, label: 'Payroll', path: '/admin/payroll', visible: canManagePayroll },
    { icon: Users, label: 'Members', path: '/members', visible: isAdmin },
    { icon: Building2, label: 'Governance', path: '/governance', visible: isAdmin },
  ];

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  return (
    <>
    <button aria-label="Close navigation" onClick={onClose} className={cn("fixed inset-0 z-40 bg-slate-950/35 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")} />
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-700 transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <Logo className="h-9 w-9" />
        <div>
          <h1 className="text-sm font-semibold leading-none text-slate-900">OICL Cooperative</h1>
          <p className="mt-1 text-[11px] text-slate-500">Member services</p>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"><X className="h-5 w-5" /></button>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <p className="mb-3 px-3 text-xs font-medium text-slate-500">Workspace</p>
        {navItems.filter(i => i.visible).map((item) => (
          <button
            key={item.label}
            onClick={() => { navigate(item.path); onClose?.(); }}
            className={cn(
              "group flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
              currentPath === item.path 
                ? "border-emerald-800 bg-emerald-50 text-emerald-950" 
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-4.5 w-4.5", currentPath === item.path ? "text-emerald-800" : "text-slate-500 group-hover:text-slate-700")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold uppercase text-emerald-900">
            {member?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-slate-900">{member?.fullName || 'Authenticating...'}</p>
            <p className="truncate text-xs capitalize text-slate-500">{member?.role || 'Guest'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
    </>
  );
};
