import React, { useEffect, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, Plus, Scale, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/StatCard';

const fieldClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15';

export const Governance: React.FC = () => {
  const [data, setData] = useState<any>({ meetings: [], specialLevies: [], activeMembers: 0, quorumRequired: 0 });
  const [error, setError] = useState('');
  const [meeting, setMeeting] = useState({ title: '', type: 'annual_general', scheduledAt: '' });
  const [levy, setLevy] = useState({ title: '', purpose: '', amount: 0, approvedAt: '', effectiveAt: '', generalMeetingApproved: true });

  const load = async () => {
    try { setData(await api.governance.getOverview()); } catch (err: any) { setError(err.message); }
  };
  useEffect(() => { load(); }, []);

  const createMeeting = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await api.governance.createMeeting(meeting); setMeeting({ title: '', type: 'annual_general', scheduledAt: '' }); await load(); }
    catch (err: any) { setError(err.message); }
  };

  const createLevy = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await api.governance.createSpecialLevy(levy); setLevy({ title: '', purpose: '', amount: 0, approvedAt: '', effectiveAt: '', generalMeetingApproved: true }); await load(); }
    catch (err: any) { setError(err.message); }
  };

  const completeMeeting = async (item: any) => {
    const attendeesCount = Number(prompt(`Attendance count (minimum quorum: ${item.quorumRequired})`));
    if (!attendeesCount) return;
    const minutes = prompt('Enter a concise minutes/reference note:') || '';
    try { await api.governance.completeMeeting(item._id, { attendeesCount, minutes }); await load(); }
    catch (err: any) { setError(err.message); }
  };

  return <div className="space-y-8">
    <div><h1 className="page-title">Governance & General Meetings</h1><p className="page-subtitle">Meeting notices, one-third quorum control, and General Meeting-approved special levies.</p></div>
    <div className="grid gap-5 md:grid-cols-3">
      <StatCard title="Active Members" value={String(data.activeMembers)} icon={Users} />
      <StatCard title="Required Quorum" value={String(data.quorumRequired)} icon={Scale} />
      <StatCard title="Recorded Meetings" value={String(data.meetings.length)} icon={Building2} />
    </div>
    {error && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</div>}

    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={createMeeting} className="surface space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><CalendarDays className="h-5 w-5 text-emerald-800" /> Schedule general meeting</h2>
        <input className={`${fieldClass} w-full`} placeholder="Meeting title" value={meeting.title} onChange={e => setMeeting({ ...meeting, title: e.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2"><select className={fieldClass} value={meeting.type} onChange={e => setMeeting({ ...meeting, type: e.target.value })}><option value="annual_general">Annual General</option><option value="special_general">Special General</option></select><input type="datetime-local" className={fieldClass} value={meeting.scheduledAt} onChange={e => setMeeting({ ...meeting, scheduledAt: e.target.value })} required /></div>
        <p className="text-xs text-slate-500">The system enforces the SOP's minimum 24-hour notice.</p>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950"><Plus className="h-4 w-4" /> Schedule meeting</button>
      </form>

      <form onSubmit={createLevy} className="surface space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Scale className="h-5 w-5 text-emerald-800" /> Record special levy</h2>
        <div className="grid gap-3 sm:grid-cols-2"><input className={fieldClass} placeholder="Levy title" value={levy.title} onChange={e => setLevy({ ...levy, title: e.target.value })} required /><input type="number" min="1" className={fieldClass} placeholder="Amount" value={levy.amount || ''} onChange={e => setLevy({ ...levy, amount: Number(e.target.value) })} required /></div>
        <input className={`${fieldClass} w-full`} placeholder="Purpose / approved project" value={levy.purpose} onChange={e => setLevy({ ...levy, purpose: e.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500">Approval date<input type="date" className={`${fieldClass} mt-1 w-full`} value={levy.approvedAt} onChange={e => setLevy({ ...levy, approvedAt: e.target.value })} required /></label><label className="text-xs font-bold text-slate-500">Effective date<input type="date" className={`${fieldClass} mt-1 w-full`} value={levy.effectiveAt} onChange={e => setLevy({ ...levy, effectiveAt: e.target.value })} required /></label></div>
        <label className="flex gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={levy.generalMeetingApproved} onChange={e => setLevy({ ...levy, generalMeetingApproved: e.target.checked })} /> General Meeting approval confirmed</label>
        <button className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950">Record levy</button>
      </form>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="surface overflow-hidden"><h2 className="border-b border-slate-200 p-5 text-base font-semibold text-slate-900">Meeting register</h2><div className="divide-y divide-slate-100">{data.meetings.length ? data.meetings.map((item: any) => <div key={item._id} className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="text-xs text-slate-600">{new Date(item.scheduledAt).toLocaleString()} - quorum {item.quorumRequired}</p></div>{item.status === 'scheduled' ? <button onClick={() => completeMeeting(item)} className="rounded-md bg-emerald-900 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-950">Record attendance</button> : <span className="flex items-center gap-1 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Completed</span>}</div>) : <p className="p-8 text-center text-sm text-slate-500">No meetings recorded.</p>}</div></section>
      <section className="surface overflow-hidden"><h2 className="border-b border-slate-200 p-5 text-base font-semibold text-slate-900">Special levy register</h2><div className="divide-y divide-slate-100">{data.specialLevies.length ? data.specialLevies.map((item: any) => <div key={item._id} className="p-5"><div className="flex justify-between"><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="font-semibold text-slate-900">{formatCurrency(item.amount)}</p></div><p className="mt-1 text-xs text-slate-600">Effective {new Date(item.effectiveAt).toLocaleDateString()} - {item.purpose}</p></div>) : <p className="p-8 text-center text-sm text-slate-500">No special levies recorded.</p>}</div></section>
    </div>
  </div>;
};
