import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Users, Clock, LogOut, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = api.auth.getUser();
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      const data = await api.admin.getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [isAdmin]);

  const updateStatus = async (member: any, action: string) => {
    const labels: Record<string, string> = { approve: 'approve', reject: 'reject', activate: 'activate', terminate: 'terminate' };
    if (!confirm(`Are you sure you want to ${labels[action]} ${member.fullName}'s membership?`)) return;
    const comment = prompt('Add an EXCO/Secretariat note (optional):') || '';
    try {
      await api.admin.updateMemberStatus(member._id, action, comment, action === 'activate');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Unable to update membership.');
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(search.toLowerCase()) || 
    m.staffId.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending_review').length,
    activation: members.filter(m => m.status === 'approved_pending_activation').length,
    inactive: members.filter(m => ['retired', 'resigned', 'terminated', 'rejected'].includes(m.status)).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Member Registry</h1>
          <p className="page-subtitle">Centralized directory of all OICL Staff Cooperative participants.</p>
        </div>
        <button onClick={() => window.location.assign('/activate-membership')} className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950">
          <UserPlus className="w-4 h-4" />
          Onboard New Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Members" value={stats.active.toString()} icon={Users} />
        <StatCard title="Pending Approvals" value={stats.pending.toString()} icon={Clock} className="border-l-4 border-l-amber-400" />
        <StatCard title="Awaiting Activation" value={stats.activation.toString()} icon={ShieldCheck} />
        <StatCard title="Inactive / Closed" value={stats.inactive.toString()} icon={LogOut} />
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or staff ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-800 sm:w-72"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter by Department
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Full Name & Staff ID</th>
                <th className="px-8 py-4">Department</th>
                <th className="px-8 py-4">Coop Role</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">Contacting society registry...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">No matching members found</td></tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {member.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tight">{member.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600">{member.department}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium capitalize",
                        ['admin', 'treasurer', 'president'].includes(member.role) ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-600"
                      )}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          member.status === 'active' ? "bg-emerald-700" : "bg-amber-500"
                        )}></div>
                        <span className="text-xs font-medium capitalize text-slate-700">{member.status.replaceAll('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {member.status === 'pending_review' && <>
                          <button onClick={() => updateStatus(member, 'approve')} className="flex items-center gap-1 rounded-md bg-emerald-900 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-950"><CheckCircle className="h-3 w-3" /> Approve</button>
                          <button onClick={() => updateStatus(member, 'reject')} className="flex items-center gap-1 rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"><XCircle className="h-3 w-3" /> Reject</button>
                        </>}
                        {member.status === 'approved_pending_activation' && <button onClick={() => updateStatus(member, 'activate')} className="rounded-md bg-emerald-900 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-950">Confirm N5,000 & Activate</button>}
                        {member.status === 'active' && <button onClick={() => updateStatus(member, 'terminate')} className="rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50">Terminate</button>}
                      </div>
                    </td>
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
