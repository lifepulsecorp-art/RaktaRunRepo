import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  Navigation,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';
import { RaktaRunLogo } from '../components/RaktaRunLogo';
import { BRAND_TAGLINE } from '../constants/brand';

const COMPATIBILITY_DATA: Record<string, { canGiveTo: string[]; isUniversal?: boolean; note: string }> = {
  'O-': { canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], isUniversal: true, note: 'Universal Red Cell Hero! Vital in immediate trauma resuscitations.' },
  'O+': { canGiveTo: ['O+', 'A+', 'B+', 'AB+'], note: 'Most requested blood type for acute emergency surgeries.' },
  'A-': { canGiveTo: ['A-', 'A+', 'AB-', 'AB+'], note: 'Essential emergency donor for A and AB emergency admissions.' },
  'A+': { canGiveTo: ['A+', 'AB+'], note: 'Critical for scheduled trauma and oncology platelet transfers.' },
  'B-': { canGiveTo: ['B-', 'B+', 'AB-', 'AB+'], note: 'Rare emergency group critical for regional multi-specialty care.' },
  'B+': { canGiveTo: ['B+', 'AB+'], note: 'Vital lifeline for emergency transfusion wards across coastal Karnataka.' },
  'AB-': { canGiveTo: ['AB-', 'AB+'], note: 'Universal plasma donor; rare cellular emergency match.' },
  'AB+': { canGiveTo: ['AB+'], note: 'Universal recipient of red cells; universal life-saving plasma donor.' },
};

export default function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('O-');
  const compInfo = COMPATIBILITY_DATA[selectedGroup] || COMPATIBILITY_DATA['O-'];

  return (
    <AppLayout withSidebar={false}>
      <div className="mx-auto max-w-7xl space-y-16 py-4 sm:py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-12 shadow-sm sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block xl:right-12">
            <RaktaRunLogo size="hero" theme="light" className="pointer-events-auto" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-6 lg:max-w-[calc(100%-25rem)] xl:max-w-[calc(100%-33rem)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/5 px-3.5 py-1.5 text-xs font-bold tracking-wide text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>A little care can go a long way</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
              BLOOD. WHEN EVERY SECOND COUNTS
            </p>

            <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-[-0.065em] text-slate-900 sm:text-7xl lg:text-[5.5rem]">
              A little help,
              <br />
              <span className="text-rose-600">a whole lot of</span>
              <br />
              <span className="text-rose-600">hope.</span>
            </h1>

            <p className="text-lg font-extrabold tracking-tight text-emerald-900 sm:text-xl">
              {BRAND_TAGLINE}
            </p>

            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              <span className="font-bold text-slate-800">Making Emergency Donor Discovery Faster and Easier.</span>{' '}
              When someone needs blood, RaktaRun brings nearby donors and local hospitals together. It is simple to join, easy to use, and made for showing up when it matters.
            </p>

            <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-rose-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-rose-900/15 transition hover:-translate-y-0.5 hover:bg-rose-700 sm:w-auto"
              >
                <span>Join the donor community</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/hero-wall"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/60 px-6 py-4 text-sm font-bold text-slate-800 transition hover:bg-white sm:w-auto"
              >
                <span>Meet our community</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Hospital-screened donors
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Here for our community
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Local to coastal Karnataka
              </span>
            </div>
          </div>
        </section>

        {/* Live Network Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-rose-500">
              <Clock className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Response</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">7.2 mins</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From alert to donor acceptance</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-emerald-500">
              <Users className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Screened Donors</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">1,420+</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Certified by partner blood banks</p>
          </div>

          <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-5 shadow-md shadow-rose-950/5 ring-1 ring-rose-200/70 dark:border-rose-500/50 dark:bg-rose-950/30 dark:ring-rose-500/20">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Trauma Centers</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-display sm:text-3xl">38 Units</p>
            <p className="mt-1 text-xs text-rose-900/75 dark:text-rose-200/80">Kasturba, AJ, Wenlock & network</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-amber-500">
              <Navigation className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">GPS Transit</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">100% Live</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real-time turn-by-turn navigation</p>
          </div>
        </section>

        {/* 3-Step Emergency Flow */}
        <section className="relative overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">From the first alert to a helping hand</span>
            <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Clear next steps.
              <br /><span className="text-amber-300">Care, all the way.</span>
            </h2>
            <p className="max-w-md text-sm leading-6 text-emerald-50/75">
              A calm, coordinated path helps donors and hospitals know what to do, right when it matters.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <div className="border-t border-white/20 py-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-amber-300">
                1
              </div>
              <h3 className="text-base font-bold text-amber-300">A hospital reaches out</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                A care team shares the blood type and details of an urgent request.
              </p>
            </div>

            <div className="border-t border-white/20 py-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-amber-300">
                2
              </div>
              <h3 className="text-base font-bold text-amber-300">Nearby donors are matched</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                The right people are notified based on blood group, availability, and distance.
              </p>
            </div>

            <div className="border-t border-white/20 py-5 sm:col-span-2 sm:grid sm:grid-cols-[2rem_1fr] sm:gap-3">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-amber-300 sm:mb-0">
                3
              </div>
              <div>
              <h3 className="text-base font-bold text-amber-300">A donor shows up</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                Donors can accept an invitation and get clear directions to the hospital.
              </p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Interactive Compatibility Matrix Quick Checker */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Emergency Compatibility Guide</span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
              See Who You Can Save With Your Blood Group
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select your blood type to preview emergency compatibility:
            </p>

            {/* Blood Type Pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {Object.keys(COMPATIBILITY_DATA).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`h-10 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    selectedGroup === grp
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Compatibility Detail Box */}
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-50/50 p-6 text-left dark:border-rose-500/20 dark:bg-rose-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Selected Group:</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{selectedGroup}</p>
                </div>
                {compInfo.isUniversal && (
                  <span className="self-start rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Award className="h-4 w-4" /> Universal Emergency Donor
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Can safely donate red cells to:
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {compInfo.canGiveTo.map((target) => (
                    <span
                      key={target}
                      className="rounded-lg bg-white border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-sm dark:bg-slate-900 dark:border-rose-900/40 dark:text-rose-300"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 italic">
                {compInfo.note}
              </p>
            </div>
          </div>
        </section>

        {/* Community Wall Teaser */}
        <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent p-8 sm:p-12 text-center dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-amber-950/20 dark:via-rose-950/20 dark:to-transparent">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
              <span>Coastal Karnataka Hero Hall of Fame</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              Celebrating Real Life Savers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Every accepted dispatch and hospital donation earns verified hero badges and community recognition.
            </p>
            <div className="pt-2">
              <Link
                to="/hero-wall"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <span>View Community Hero Leaderboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RaktaRunLogo size="sm" />
              <p className="max-w-48 text-[11px] font-bold leading-snug text-slate-600 dark:text-slate-300">
                {BRAND_TAGLINE}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/hero-wall" className="hover:text-slate-900 dark:hover:text-white transition">Heroes Wall</Link>
              <Link to="/register/hospital" className="hover:text-slate-900 dark:hover:text-white transition">Hospital Enrolment</Link>
              <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition">Sign In</Link>
            </div>
            <p className="text-center sm:text-right">© 2026 RaktaRun, Inavyas Technologies Pvt Ltd</p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
