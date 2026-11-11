import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import { RaktaRunLogo } from '../components/RaktaRunLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import api from '../utils/api';
import { getPasswordPolicyError, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not reset the password. Request a new link and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex justify-center"><RaktaRunLogo size="md" /></div>
        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Your new password is ready. Sign in to access your account.</p>
            <Link to="/login" className="inline-flex w-full justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500">Go to sign in</Link>
          </div>
        ) : !token ? (
          <div className="space-y-4 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="text-2xl font-bold">Reset link is missing</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Request a new password reset link from your registered email.</p>
            <Link to="/forgot-password" className="inline-flex w-full justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500">Request a reset link</Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Create a new password</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Your email reset link is verified when you submit a new password.</p>
            </div>
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><ShieldAlert className="h-5 w-5 shrink-0" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                New password
                <PasswordInput required autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} leadingIcon={<Lock className="h-4 w-4" />} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Confirm new password
                <PasswordInput required autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{PASSWORD_POLICY_MESSAGE}</p>
              <Button type="submit" isLoading={submitting} className="w-full">Save new password</Button>
            </form>
          </>
        )}
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
