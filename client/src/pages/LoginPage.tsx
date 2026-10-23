import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, Activity, ArrowLeft } from 'lucide-react';
import { RaktaRunLogo } from '../components/RaktaRunLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, role, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect immediately to the correct portal
  useEffect(() => {
    if (!loading && firebaseUser && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'hospital') navigate('/hospital', { replace: true });
      else if (role === 'donor') navigate('/donor', { replace: true });
    }
  }, [firebaseUser, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const userProfile = await login(email, password);
      const targetRole = userProfile?.role;

      if (targetRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (targetRole === 'hospital') {
        navigate('/hospital', { replace: true });
      } else {
        navigate('/donor', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Floating Controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* Left Column: Branding / Mission (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-gradient-to-br from-rose-50/60 via-slate-50 to-rose-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/40 p-12 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-rose-500/10 dark:bg-rose-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <RaktaRunLogo size="lg" showSubtitle={true} />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
            Medically Screened Emergency Network
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            Every minute matters. <br />
            <span className="text-rose-600 dark:text-rose-500">Connect. Locate. Respond. Save.</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A real-time emergency blood coordination system connecting hospital-screened donors with emergency care units
            across coastal Karnataka.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">7.2 min</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Average emergency dispatch response</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Hospital-verified medical certificates</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 dark:text-slate-500">
          RaktaRun Emergency Portal • Coastal Karnataka Trauma Response
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex min-w-0 flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md space-y-5 sm:space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <RaktaRunLogo size="md" showSubtitle={true} />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In to RaktaRun</h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Enter your credentials to access your verified medical dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@raktarun.in"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Password
              </label>
              <div className="mt-1.5">
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leadingIcon={<Lock className="h-4 w-4" />}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={submitting}
              className="w-full py-3 text-sm font-semibold shadow-lg shadow-rose-600/25"
            >
              Sign In <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>


          <div className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
            New to RaktaRun?{' '}
            <Link to="/register" className="font-semibold text-rose-600 dark:text-rose-500 hover:text-rose-500 hover:underline">
              Register here →
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
