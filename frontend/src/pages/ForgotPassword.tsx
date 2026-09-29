import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';

export const ForgotPassword: React.FC = () => {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResult(await api.auth.forgotPassword(email));
    } catch (err: any) {
      setError(err.message || 'Unable to request a password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-5 h-12 w-12" />
          <h1 className="text-2xl font-semibold text-slate-900">Forgot your password?</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Enter your staff email and we’ll send you a secure reset link.</p>
        </div>

        {result ? (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{result.message}</span>
            </div>
            {result.developmentResetUrl && (
              <a href={result.developmentResetUrl} className="block text-center text-sm font-medium text-emerald-800 hover:underline">Open development reset link</a>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Staff email" required className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15" />
            </div>
            {error && <div className="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-600">{error}</div>}
            <button disabled={loading} className="w-full rounded-lg bg-emerald-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};
