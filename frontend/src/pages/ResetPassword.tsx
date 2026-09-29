import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) return setError('This reset link is missing its security token. Request a new link.');
    if (password.length < 8) return setError('Password must contain at least 8 characters.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setComplete(true);
    } catch (err: any) {
      setError(err.message || 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-5 h-12 w-12" />
          <h1 className="text-2xl font-semibold text-slate-900">Create a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a password with at least 8 characters.</p>
        </div>

        {complete ? (
          <div className="space-y-5 text-center">
            <div className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle className="h-5 w-5 shrink-0" /> Password reset successfully.
            </div>
            <button onClick={() => navigate('/login')} className="w-full rounded-lg bg-emerald-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950">Continue to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {[{ label: 'New password', value: password, set: setPassword }, { label: 'Confirm password', value: confirmation, set: setConfirmation }].map(field => (
              <div className="relative" key={field.label}>
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="password" value={field.value} onChange={event => field.set(event.target.value)} placeholder={field.label} minLength={8} required className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-colors focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15" />
              </div>
            ))}
            {error && <div className="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-600">{error}</div>}
            <button disabled={loading} className="w-full rounded-lg bg-emerald-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-950 disabled:opacity-50">{loading ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}

        {!complete && <Link to="/forgot-password" className="mt-7 block text-center text-sm font-medium text-slate-600 hover:text-slate-900">Request a new reset link</Link>}
      </div>
    </div>
  );
};
