import React, { useState } from 'react';
import { X, Wallet, Landmark, HeartPulse, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContributionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'thrift',
    amount: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert('Please enter a valid amount');

    setSubmitting(true);
    try {
      await api.savings.contribute(formData);
      onSuccess();
      onClose();
      setFormData({ type: 'thrift', amount: 0, notes: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to process contribution');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const contributionTypes = [
    { id: 'thrift', label: 'Thrift Savings', icon: Wallet, color: 'text-blue-600' },
    { id: 'shares', label: 'Share Capital', icon: Landmark, color: 'text-emerald-600' },
    { id: 'welfare', label: 'Welfare Fund', icon: HeartPulse, color: 'text-rose-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">New Manual Contribution</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Select Category</label>
            <div className="grid grid-cols-3 gap-3">
              {contributionTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id })}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    formData.type === t.id ? 'border-slate-900 bg-slate-50' : 'border-slate-50 hover:border-slate-100'
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${t.color}`} />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Amount (₦)</label>
            <input 
              required
              type="number"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-slate-900/20 transition-colors"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Reference / Note</label>
            <textarea 
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:border-slate-900/20 transition-colors h-24 resize-none"
              placeholder="e.g., Share capital top-up for Q3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-2 py-4 px-6 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Contribution'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};