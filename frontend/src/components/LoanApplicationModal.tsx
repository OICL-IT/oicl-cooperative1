import React, { useState, useEffect } from 'react';
import { X, Calculator, Info, UserCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoanApplicationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [members] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    principal: 0,
    tenure: 12,
    guarantorIds: [] as string[],
    purpose: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const cats = await api.loans.getCategories();
          setCategories(cats);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const selectedCategory = categories.find(c => c._id === formData.categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || formData.principal <= 0 || formData.guarantorIds.length < (selectedCategory?.requiredGuarantors || 0)) {
      alert('Please fill all required fields correctly');
      return;
    }

    setSubmitting(true);
    try {
      await api.loans.apply(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Credit Facility Application</h2>
              <p className="text-xs text-slate-500">Apply for cooperative credit with automated approval tracking.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {loading ? (
            <div className="py-20 text-center text-slate-400 italic">Initializing loan parameters...</div>
          ) : (
            <>
              {/* Category Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Selected Loan Product</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setFormData({ ...formData, categoryId: cat._id, tenure: cat.maxTenure, guarantorIds: [], purpose: '' })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.categoryId === cat._id 
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/5' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <p className={`font-bold text-sm ${formData.categoryId === cat._id ? 'text-emerald-900' : 'text-slate-700'}`}>{cat.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{cat.interestRate}% {cat.interestMethod} interest - {cat.maxTenure} months</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Principal and Tenure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Requested Amount (₦)</label>
                  <input 
                    type="number"
                    value={formData.principal || ''}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-emerald-500/30 transition-colors"
                    placeholder="Enter amount"
                  />
                  {selectedCategory && (
                    <p className="text-[10px] font-bold text-emerald-600 px-1 italic">Limit is based on savings multiplier</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Tenure (Months)</label>
                  <input 
                    type="number"
                    max={selectedCategory?.maxTenure || 60}
                    value={formData.tenure}
                    onChange={(e) => setFormData({ ...formData, tenure: Number(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-emerald-500/30 transition-colors"
                    readOnly
                  />
                </div>
              </div>

              {selectedCategory?.code === 'commodity' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Selected Food Items</label>
                  <textarea required value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-emerald-500/30" placeholder="List the selected food items requested" />
                </div>
              )}

              {/* Guarantors */}
              {(selectedCategory?.requiredGuarantors || 0) > 0 && <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Select Credit Guarantors</label>
                  <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-tighter">
                    {selectedCategory?.requiredGuarantors || 0} Required
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                  {members.map((m) => (
                    <label 
                      key={m._id}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.guarantorIds.includes(m._id)
                          ? 'border-emerald-500/30 bg-emerald-50/50'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.guarantorIds.includes(m._id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...formData.guarantorIds, m._id]
                            : formData.guarantorIds.filter(id => id !== m._id);
                          setFormData({ ...formData, guarantorIds: ids });
                        }}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                        formData.guarantorIds.includes(m._id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'
                      }`}>
                        {formData.guarantorIds.includes(m._id) && <UserCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{m.fullName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{m.department}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>}

              {/* Quick Calc Info */}
              {selectedCategory && formData.principal > 0 && (
                <div className="p-5 bg-slate-900 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg text-emerald-400">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Monthly Deduction</p>
                      <p className="text-xl font-black text-white tracking-tighter">
                        {formatCurrency(formData.principal / formData.tenure + (selectedCategory.interestMethod === 'reducing' ? formData.principal * (selectedCategory.interestRate / 100 / 12) : formData.principal * (selectedCategory.interestRate / 100) / formData.tenure))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Interest</p>
                    <p className="text-sm font-bold text-emerald-400">
                       {formatCurrency(selectedCategory.interestMethod === 'flat' ? formData.principal * (selectedCategory.interestRate / 100) : formData.principal * (selectedCategory.interestRate / 100 / 12) * ((formData.tenure + 1) / 2))}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex-[2] py-4 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Submit Credit Request'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
