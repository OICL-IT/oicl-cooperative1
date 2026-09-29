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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">New Manual Contribution</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          <div className="space-y-3">
            <label className="block px-1 text-sm font-medium text-slate-700">Select category</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {contributionTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id })}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors sm:flex-col sm:text-center ${
                    formData.type === t.id ? 'border-emerald-800 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${t.color}`} />
                  <span className="text-sm font-medium text-slate-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-medium text-slate-700">Amount (₦)</label>
            <input 
              required
              type="number"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-medium text-slate-700">Reference / note</label>
            <textarea 
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
              className="h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              placeholder="e.g., Share capital top-up for Q3"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-[2] rounded-lg bg-emerald-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Contribution'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};