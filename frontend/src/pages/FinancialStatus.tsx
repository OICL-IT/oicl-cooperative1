import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Download,
  FileText,
  HandCoins,
  Landmark,
  Pencil,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import type { FinancialStatus as FinancialStatusType } from '@/types';

const REPORT_ROLES = ['admin', 'president', 'treasurer', 'auditor'];
const currentPeriod = () => new Date().toISOString().slice(0, 7);
const readablePeriod = (period: string) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const StatusBadge = ({ value }: { value: string }) => (
  <span className={cn(
    'inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize',
    value === 'active' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-800',
  )}>
    {value.replaceAll('_', ' ')}
  </span>
);

const BalanceBreakdown = ({ status }: { status: FinancialStatusType }) => {
  const rows = [
    ['Ordinary savings', status.balances.ordinarySavings],
    ['Target savings', status.balances.targetSavings],
    ['Investment shares', status.balances.investmentShares],
    ['2026 AGM levy paid', status.balances.agmLevy],
    ['Development levy paid', status.balances.developmentLevy],
    ['Normal loan balance', status.balances.normalLoan],
    ['Emergency loan balance', status.balances.emergencyLoan],
    ['Commodity loan balance', status.balances.commodityLoan],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Balances</h2>
          <p className="mt-1 text-xs text-slate-500">Cumulative position through {readablePeriod(status.period)}.</p>
        </div>
        <dl className="divide-y divide-slate-100 px-5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-4">
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className={cn(
                'financial-data text-sm font-bold',
                label.includes('loan') && value > 0 ? 'text-amber-700' : 'text-slate-900',
              )}>{formatCurrency(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Monthly deductions</h2>
          <p className="mt-1 text-xs text-slate-500">Expected payroll deductions at the reporting date.</p>
        </div>
        <dl className="divide-y divide-slate-100 px-5">
          {[
            ['Ordinary savings', status.monthlyDeductions.ordinarySavings],
            ['Target savings', status.monthlyDeductions.targetSavings],
            ['AGM levy', status.monthlyDeductions.agmLevy],
            ['Development levy', status.monthlyDeductions.developmentLevy],
            ['Normal loan', status.monthlyDeductions.normalLoan],
            ['Emergency loan', status.monthlyDeductions.emergencyLoan],
            ['Commodity loan', status.monthlyDeductions.commodityLoan],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-4">
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className="financial-data text-sm font-bold text-slate-900">{formatCurrency(Number(value))}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-5">
            <dt className="text-xs font-black uppercase tracking-wide text-slate-900">Total monthly deduction</dt>
            <dd className="financial-data text-base font-black text-emerald-700">{formatCurrency(status.monthlyDeductions.total)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

export const FinancialStatus: React.FC = () => {
  const user = api.auth.getUser();
  const canViewReport = REPORT_ROLES.includes(user?.role);
  const [period, setPeriod] = useState(currentPeriod());
  const [members, setMembers] = useState<FinancialStatusType[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selected, setSelected] = useState<FinancialStatusType | null>(null);
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (canViewReport) {
        const data = await api.financialStatus.getReport(period);
        setMembers(data.members);
        setSummary(data.summary);
        setSelected(current => data.members.find((member: FinancialStatusType) => member.memberId === current?.memberId) || null);
      } else {
        const data = await api.financialStatus.getMine(period);
        setMembers([data]);
        setSelected(data);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load financial status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period, canViewReport]);

  const companies = useMemo(
    () => Array.from(new Set(members.map(member => member.companyName).filter(Boolean))).sort(),
    [members],
  );
  const filtered = members.filter(member => {
    const term = search.trim().toLowerCase();
    return (company === 'all' || member.companyName === company)
      && (!term || `${member.fullName} ${member.staffId} ${member.membershipNumber || ''}`.toLowerCase().includes(term));
  });

  const updateRemarks = async (member: FinancialStatusType) => {
    const remarks = prompt(`Financial remarks for ${member.fullName}:`, member.remarks);
    if (remarks === null) return;
    try {
      await api.financialStatus.updateRemarks(member.memberId, remarks);
      setMembers(current => current.map(item => item.memberId === member.memberId ? { ...item, remarks } : item));
      setSelected(current => current?.memberId === member.memberId ? { ...current, remarks } : current);
    } catch (err: any) {
      alert(err.message || 'Unable to update remarks.');
    }
  };

  const exportCsv = () => {
    const headers = [
      'Staff ID', 'Member', 'Company', 'Status', 'Ordinary Savings', 'Target Savings',
      'Investment Shares', 'AGM Levy', 'Development Levy', 'Normal Loan', 'Emergency Loan',
      'Commodity Loan', 'Total Loan Exposure', 'Monthly Deduction', 'Pending Requests', 'Remarks',
    ];
    const rows = filtered.map(member => [
      member.staffId, member.fullName, member.companyName, member.membershipStatus,
      member.balances.ordinarySavings, member.balances.targetSavings, member.balances.investmentShares,
      member.balances.agmLevy, member.balances.developmentLevy, member.balances.normalLoan, member.balances.emergencyLoan,
      member.balances.commodityLoan, member.balances.totalLoanExposure, member.monthlyDeductions.total,
      member.pendingLoanRequests.length, member.remarks,
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `member-financial-status-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadImportTemplate = () => {
    const headers = [
      'staff_id',
      'full_name',
      'email_address',
      'company_name',
      'membership_status',
      'reporting_period',
      'ordinary_savings_balance',
      'target_savings_balance',
      'investment_shares',
      'agm_levy_paid',
      'development_levy_paid',
      'normal_loan_balance',
      'emergency_loan_balance',
      'commodity_loan_balance',
      'monthly_ordinary_savings',
      'monthly_target_savings',
      'monthly_normal_loan',
      'monthly_emergency_loan',
      'monthly_commodity_loan',
      'remarks',
    ];
    const rows = members.map(member => [
      member.staffId,
      member.fullName,
      member.email,
      member.companyName,
      member.membershipStatus,
      period,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    const csv = `\uFEFF${[headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `member-opening-balances-template-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex h-[55vh] items-center justify-center text-sm font-bold text-slate-400">Preparing member financial status…</div>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-emerald-800">
            {canViewReport ? 'Society financial register' : 'Private member statement'}
          </p>
          <h1 className="page-title">{canViewReport ? 'Member Financial Status' : 'My Financial Status'}</h1>
          <p className="page-subtitle">Savings, loan exposure and monthly deductions in one statement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600">
            As at
            <input
              type="month"
              value={period}
              max={currentPeriod()}
              onChange={event => setPeriod(event.target.value)}
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800"
            />
          </label>
          {canViewReport && (
            <>
              <button onClick={downloadImportTemplate} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <FileText className="h-4 w-4" /> Download Import Template
              </button>
              <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-emerald-900 px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950">
                <Download className="h-4 w-4" /> Export Current Report
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

      {canViewReport && summary ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Members Reported" value={summary.memberCount} icon={Users} />
            <StatCard title="Ordinary Savings" value={formatCurrency(summary.totalOrdinarySavings)} icon={Wallet} />
            <StatCard title="Loan Exposure" value={formatCurrency(summary.totalLoanExposure)} icon={HandCoins} className="border-l-4 border-l-amber-400" />
            <StatCard title="Active Borrowers" value={summary.activeBorrowers} icon={Landmark} />
          </div>

          <section className="surface overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search member or staff ID"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-800 sm:w-72"
                />
              </div>
              <select value={company} onChange={event => setCompany(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700">
                <option value="all">All companies</option>
                {companies.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
              <span className="ml-auto text-sm text-slate-500">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-4">Member</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4 text-right">Ordinary savings</th>
                    <th className="px-5 py-4 text-right">Target savings</th>
                    <th className="px-5 py-4 text-right">Investment shares</th>
                    <th className="px-5 py-4 text-right">2026 AGM levy</th>
                    <th className="px-5 py-4 text-right">Development levy</th>
                    <th className="px-5 py-4 text-right">Normal loan</th>
                    <th className="px-5 py-4 text-right">Emergency loan</th>
                    <th className="px-5 py-4 text-right">Commodity loan</th>
                    <th className="px-5 py-4 text-right">Loan exposure</th>
                    <th className="px-5 py-4 text-right">Monthly deduction</th>
                    <th className="px-5 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(member => (
                    <tr key={member.memberId} className="cursor-pointer hover:bg-emerald-50/40" onClick={() => setSelected(member)}>
                      <td className="px-5 py-4"><p className="text-xs font-extrabold text-slate-900">{member.fullName}</p><p className="mt-1 font-mono text-[9px] font-bold text-slate-400">{member.staffId}</p></td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-600">{member.companyName}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.balances.ordinarySavings)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.balances.targetSavings)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.balances.investmentShares)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.balances.agmLevy)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.balances.developmentLevy)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold text-amber-700">{formatCurrency(member.balances.normalLoan)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold text-amber-700">{formatCurrency(member.balances.emergencyLoan)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold text-amber-700">{formatCurrency(member.balances.commodityLoan)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold text-amber-700">{formatCurrency(member.balances.totalLoanExposure)}</td>
                      <td className="financial-data px-5 py-4 text-right text-xs font-bold">{formatCurrency(member.monthlyDeductions.total)}</td>
                      <td className="max-w-56 px-5 py-4">
                        <button
                          onClick={event => { event.stopPropagation(); updateRemarks(member); }}
                          className="flex max-w-full items-center gap-2 text-left text-[10px] font-semibold text-slate-500 hover:text-emerald-700"
                        >
                          <Pencil className="h-3 w-3 shrink-0" />
                          <span className="truncate">{member.remarks || 'Add remark'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <div className="p-12 text-center text-sm font-bold text-slate-400">No matching member records.</div>}
            </div>
          </section>
        </>
      ) : selected ? (
        <>
          <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-emerald-900"><FileText className="h-5 w-5" /></div>
              <div><h2 className="font-semibold text-slate-900">{selected.fullName}</h2><p className="mt-1 text-xs text-slate-500">{selected.staffId} · {selected.companyName} · {selected.department}</p></div>
            </div>
            <StatusBadge value={selected.membershipStatus} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Ordinary Savings" value={formatCurrency(selected.balances.ordinarySavings)} icon={Wallet} />
            <StatCard title="Total Loan Exposure" value={formatCurrency(selected.balances.totalLoanExposure)} icon={HandCoins} />
            <StatCard title="Monthly Deduction" value={formatCurrency(selected.monthlyDeductions.total)} icon={Building2} />
          </div>
          <BalanceBreakdown status={selected} />
          {(selected.pendingLoanRequests.length > 0 || selected.remarks) && (
            <section className="surface p-5">
              <h2 className="text-sm font-semibold text-slate-900">Notes and pending requests</h2>
              {selected.remarks && <p className="mt-3 rounded-xl bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-900">{selected.remarks}</p>}
              {selected.pendingLoanRequests.map(request => (
                <div key={request.id} className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 p-4 text-xs">
                  <span className="font-bold text-slate-700">{request.category} · {request.status.replaceAll('_', ' ')}</span>
                  <span className="financial-data font-black">{formatCurrency(request.principal)}</span>
                </div>
              ))}
            </section>
          )}
        </>
      ) : null}

      {canViewReport && selected && (
        <section className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="font-semibold text-slate-900">{selected.fullName}</h2><p className="mt-1 text-xs text-slate-500">Selected member breakdown · {readablePeriod(selected.period)}</p></div>
            <button onClick={() => setSelected(null)} className="text-sm font-medium text-slate-600 hover:text-slate-900">Close</button>
          </div>
          <BalanceBreakdown status={selected} />
        </section>
      )}
    </div>
  );
};
