import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, UserCheck, Mail, ArrowRight, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

export const ActivateMembership: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    officialEmail: ''
  });
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.onboarding.verifyStaff(formData.officialEmail);
      // Redirect to registration page with employee data
      navigate('/register', { state: { employee: res.employee } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="relative">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
            <UserCheck className="h-6 w-6" />
          </div>
          
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Apply for membership</h1>
          <p className="mb-8 text-sm text-slate-600">OICL Staff Cooperative onboarding</p>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-800 transition-colors" />
                <input 
                  required
                  type="email"
                  placeholder="Official Email Address"
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  value={formData.officialEmail}
                  onChange={e => setFormData({ ...formData, officialEmail: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Validate HR Records
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-emerald-900">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm leading-5 text-emerald-900">
              Eligibility is limited to verified staff of OICL and its subsidiaries.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="mx-auto mt-2 flex items-center justify-center gap-1 font-medium text-emerald-800 hover:underline"
            >
              <LogIn className="w-4 h-4" /> Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
