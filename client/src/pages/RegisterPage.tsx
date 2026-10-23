import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RaktaRunLogo } from '../components/RaktaRunLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ArrowRight, ArrowLeft, HeartPulse, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { role, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && firebaseUser && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'hospital') navigate('/hospital', { replace: true });
      else if (role === 'donor') navigate('/donor', { replace: true });
    }
  }, [loading, firebaseUser, role, navigate]);

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-3 transition-colors duration-200 sm:p-6">
      {/* Top Header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl flex items-center justify-between">
          <RaktaRunLogo size="md" showSubtitle={true} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-4xl py-5 sm:py-10">
        <div className="mb-6 space-y-3 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <ShieldCheck className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            Coastal Karnataka Emergency Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Join the RaktaRun Network
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Choose your registration path to connect with emergency blood coordination across Udupi & Dakshina Kannada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donor Card */}
          <Link to="/register/donor" className="group block focus:outline-none">
            <Card className="h-full p-4 transition-all duration-200 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-500/10 dark:hover:border-rose-500/60 dark:hover:shadow-rose-950/30 flex flex-col justify-between sm:p-8">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 group-hover:scale-105 transition-transform">
                    <HeartPulse className="h-7 w-7" />
                  </div>
                  <Badge variant="destructive">Screened Donors</Badge>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Register as Donor
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
                  You have been medically screened by a hospital or blood bank and possess a valid donor certificate.
                </p>

                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Upload your hospital-issued certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Set your locality & preferred travel radius</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Receive real-time Code Red emergency alerts</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                  Continue to Donor Setup <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
                  No certificate?
                </span>
              </div>
            </Card>
          </Link>

          {/* Hospital Card */}
          <Link to="/register/hospital" className="group block focus:outline-none">
            <Card className="h-full p-4 transition-all duration-200 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:border-emerald-500/60 dark:hover:shadow-emerald-950/30 flex flex-col justify-between sm:p-8">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <Badge variant="success">Healthcare Authority</Badge>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Register Hospital
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
                  Register your medical institution, trauma center, or blood bank to broadcast emergency dispatches.
                </p>

                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Provide medical license & official contact info</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Create immediate Code Red emergency requests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Track responding donors via live GPS transit</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  Continue Hospital Setup <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Verified license required
                </span>
              </div>
            </Card>
          </Link>
        </div>

        <div className="text-center mt-10 text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-rose-600 dark:text-rose-500 hover:underline">
            Login here →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-5xl py-4 text-center text-xs text-slate-500 dark:text-slate-600">
        RaktaRun Emergency Portal • Udupi & Dakshina Kannada Medical Response Network
      </div>
    </div>
  );
}

