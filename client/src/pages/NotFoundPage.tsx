import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { RaktaRunLogo } from '../components/RaktaRunLogo';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center text-slate-900 dark:bg-slate-950 dark:text-white">
      <RaktaRunLogo size="md" />
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">404 · Page not found</p>
      <h1 className="mt-2 text-3xl font-extrabold">This page isn’t here</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">The link may be outdated, or the address may have been entered incorrectly.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => navigate('/', { replace: true })} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500">
          <ArrowLeft className="h-4 w-4" /> Go back to home
        </button>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <Home className="h-4 w-4" /> Homepage
        </Link>
      </div>
    </main>
  );
}
