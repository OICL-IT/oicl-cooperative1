import React, { useEffect, useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const COLUMNS = [
  'staff_id', 'full_name', 'company_name',
  'ordinary_savings', 'target_savings', 'agm_levy', 'development_levy',
  'normal_loan', 'emergency_loan', 'commodity_loan',
];

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const parseCsv = (text: string) => {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  // Excel in some regions saves CSV with ; or tab separators
  const firstLine = source.split(/\r?\n/)[0] || '';
  const delimiter = [',', ';', '\t'].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ',');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      records.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); records.push(row); }
  const [header, ...body] = records.filter(r => r.some(c => c.trim() !== ''));
  const keys = (header || []).map(h => h.trim().toLowerCase());
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
};

const currentPeriod = () => new Date().toISOString().slice(0, 7);

type PayrollStatus = {
  period: string;
  status: 'not_processed' | 'system_processed' | 'uploaded';
  lockAutoPayroll: boolean;
  systemGeneratedEntries: number;
  uploadedEntries: number;
  periodLocked: boolean;
  lockedAt: string | null;
  lockedBy: string;
  unlockedAt: string | null;
  unlockedBy: string;
  lockNote: string;
};

export const Payroll: React.FC = () => {
  const [period, setPeriod] = useState(currentPeriod());
  const [busy, setBusy] = useState<'download' | 'upload' | null>(null);
  const [lockBusy, setLockBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [status, setStatus] = useState<PayrollStatus | null>(null);
  const user = api.auth.getUser();
  const canUnlock = ['admin', 'president'].includes(String(user?.role || '').toLowerCase());

  const refreshStatus = async (nextPeriod = period) => {
    try {
      setStatus(await api.admin.getPayrollStatus(nextPeriod));
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    refreshStatus(period);
  }, [period]);

  const downloadTemplate = async () => {
    setBusy('download'); setError('');
    setStatusNotice('');
    try {
      const { rows } = await api.admin.getPayrollTemplate(period);
      const lines = [COLUMNS, ...rows.map((r: any) => COLUMNS.map(c => r[c]))];
      const csv = `\uFEFF${lines.map(l => l.map(csvCell).join(',')).join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll-deductions-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Unable to generate the template.');
    } finally {
      setBusy(null);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (status?.periodLocked) {
      setError(`Payroll month ${period} is locked. Unlock the month before posting adjustments.`);
      return;
    }
    if (!confirm(`Post the deductions in "${file.name}" for ${period}?`)) return;
    setBusy('upload'); setError(''); setResult(null);
    setStatusNotice('');
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length || !('staff_id' in rows[0])) {
        throw new Error('Could not read the file. Save it as CSV (not .xlsx) and keep the staff_id header row.');
      }
      const response = await api.admin.uploadPayroll(period, rows);
      setResult(response);
      await refreshStatus(period);
    } catch (err: any) {
      setError(err.message || 'Unable to upload payroll.');
    } finally {
      setBusy(null);
    }
  };

  const updateLock = async (locked: boolean) => {
    const action = locked ? 'lock' : 'unlock';
    if (!confirm(`Are you sure you want to ${action} payroll month ${period}?`)) return;
    setLockBusy(true);
    setError('');
    setStatusNotice('');
    try {
      const response = await api.admin.setPayrollLock(period, locked);
      setStatus(response);
      setResult(null);
      setStatusNotice(response.message || `Payroll month ${period} updated.`);
    } catch (err: any) {
      setError(err.message || `Unable to ${action} payroll month.`);
    } finally {
      setLockBusy(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Monthly Payroll</h1>
        <p className="page-subtitle">Download the deduction template, adjust to the actual payroll figures, then upload it to post all deductions.</p>
      </div>

      <section className="surface space-y-5 p-6">
        {status && (
          <div className={`rounded-lg border p-3 text-sm ${status.status === 'uploaded' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : status.status === 'system_processed' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            {status.status === 'uploaded' && (
              <p>
                Payroll for <span className="font-semibold">{status.period}</span> has been posted via upload ({status.uploadedEntries} entries). For corrections, upload an updated template for the same month.
              </p>
            )}
            {status.status === 'system_processed' && (
              <p>
                System payroll has already been run for <span className="font-semibold">{status.period}</span> ({status.systemGeneratedEntries} entries). Uploading a completed template will override savings and levy rows for this month.
              </p>
            )}
            {status.status === 'not_processed' && (
              <p>
                No payroll postings exist yet for <span className="font-semibold">{status.period}</span>. Best practice is to post via template upload once figures are finalized.
              </p>
            )}
            {status.periodLocked && (
              <p className="mt-2 font-semibold">
                This month is locked{status.lockedBy ? ` by ${status.lockedBy}` : ''}. Payroll uploads and system payroll are blocked until it is unlocked.
              </p>
            )}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-600">
          Payroll month
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button onClick={downloadTemplate} disabled={!!busy || !period} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {busy === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download Template
          </button>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-950 ${busy || !period || status?.periodLocked ? 'pointer-events-none opacity-50' : ''}`}>
            {busy === 'upload' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Completed Payroll
            <input type="file" accept=".csv" hidden onChange={upload} />
          </label>
          {status && !status.periodLocked && (
            <button
              onClick={() => updateLock(true)}
              disabled={lockBusy || !!busy || !period}
              className="rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {lockBusy ? 'Locking...' : 'Lock Month'}
            </button>
          )}
          {status?.periodLocked && canUnlock && (
            <button
              onClick={() => updateLock(false)}
              disabled={lockBusy || !!busy || !period}
              className="rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
            >
              {lockBusy ? 'Unlocking...' : 'Unlock Month'}
            </button>
          )}
        </div>

        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
          <li>The template lists every active member, pre-filled with expected monthly deductions (savings, levies and loan instalments).</li>
          <li>Edit only the amount columns. Leave <code>staff_id</code> unchanged; blank or 0 means no deduction.</li>
          <li>Amount formats like <code>30000</code>, <code>30,000.00</code> and <code>30.000,00</code> are all accepted.</li>
          <li>The file is posted to the month selected above, so check it before uploading.</li>
          <li>Re-uploading a month overwrites savings and levy amounts; loan repayments already posted for that month are not applied twice.</li>
          <li>Use <strong>Lock Month</strong> after reconciliation to prevent further payroll edits for that period.</li>
        </ul>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {statusNotice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{statusNotice}</div>}

      {result && (
        <section className="surface space-y-3 p-6 text-sm">
          <p className="font-semibold text-emerald-900">{result.message} {result.processed} of {result.total} rows posted.</p>
          {result.notices?.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
              {result.notices.map((n: string, i: number) => <p key={i}>{n}</p>)}
            </div>
          )}
          {result.errors?.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <p className="mb-1 font-semibold">{result.errors.length} row(s) rejected:</p>
              {result.errors.map((e: any, i: number) => <p key={i}>Row {e.row} ({e.staffId || 'no staff ID'}): {e.error}</p>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
