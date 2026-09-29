import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.auth.login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
        <section className="hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <div><p className="text-base font-semibold">OICL Cooperative</p><p className="mt-1 text-xs text-emerald-100/70">Odua Investment Company Limited</p></div>
          </div>
          <div className="max-w-md">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-200">Member services</p>
            <h1 className="font-sans text-3xl font-semibold leading-tight xl:text-4xl">Your cooperative account, all in one place.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/75">Review your contributions, keep track of loans, and stay up to date with your membership.</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-sm text-emerald-50/85">
              <span>Savings</span><span>Loans</span><span>Membership</span>
            </div>
          </div>
          <p className="text-xs text-emerald-100/60">Secure access for cooperative members</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <div className="mb-10 flex items-center gap-3 lg:hidden"><Logo className="h-11 w-11" /><span className="text-sm font-semibold text-slate-900">OICL Cooperative</span></div>
            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-emerald-800">Welcome back</p>
              <h2 className="font-sans text-2xl font-semibold text-slate-900">Sign in to your account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Enter your details to continue to the member portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <div className="relative group"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-800" /><input id="login-email" type="email" placeholder="name@oduainvest.com.ng" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15" /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label><button type="button" onClick={() => navigate(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`)} className="text-sm font-medium text-emerald-800 hover:underline">Forgot password?</button></div>
                <div className="relative group"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-800" /><input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </div>
              {error && <motion.div initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{error}</p></motion.div>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center"><p className="text-sm text-slate-600">Not yet a member? <button onClick={() => navigate('/activate-membership')} className="inline-flex items-center gap-1.5 font-medium text-emerald-800 hover:underline"><UserPlus className="h-3.5 w-3.5" /> Apply for membership</button></p></div>
          </motion.div>
        </section>
      </div>
    </main>
  );
};
