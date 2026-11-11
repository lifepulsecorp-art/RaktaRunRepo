import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from 'lucide-react';
import { RaktaRunLogo } from '../components/RaktaRunLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import api from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/auth/password-reset/request', { email: email.trim() });
      setSent(true);
      setEmail(email.trim());
      if (response.data?.message) setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not process the request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex justify-center"><RaktaRunLogo size="md" /></div>
        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              If an account with <strong>{email}</strong> exists, we sent a secure password reset link. The link expires in 30 minutes.
            </p>
            <Button type="button" onClick={() => setSent(false)} className="w-full">Send another link</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Forgot your password?</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Enter the email address registered to your RaktaRun account. We’ll email you a secure reset link.</p>
            </div>
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><ShieldAlert className="h-5 w-5 shrink-0" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Registered email address
                <span className="relative mt-1.5 block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-normal normal-case text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="you@example.com" />
                </span>
              </label>
              <Button type="submit" isLoading={submitting} className="w-full">Email reset link</Button>
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
