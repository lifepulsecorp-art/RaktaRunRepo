import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Share2, Camera, Sparkles, Lock, MapPin, HeartPulse, ShieldCheck, Users, ArrowUpRight, Droplets } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

type Hero = { id: string; displayName: string; district: string; bloodGroup: string; donations: number; responses: number; badges: string[]; profilePhotoUrl?: string | null };

const BADGE_LABELS: Record<string, { label: string; icon: string }> = {
  life_pulse_hero: { label: 'RaktaRun Hero', icon: '✦' },
  rapid_responder: { label: 'Rapid Responder', icon: '›' },
  repeat_hero: { label: 'Repeat Hero', icon: '◆' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '◇' },
  community_champion: { label: 'Community Champion', icon: '✧' },
};

function makeLandscapeCard(hero: Hero) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#881337');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillText('RAKTARUN · EMERGENCY HERO RECOGNITION', 72, 88);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px Arial, sans-serif';
  ctx.fillText(hero.displayName, 72, 220);

  ctx.font = '34px Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${hero.district} · ${hero.bloodGroup} Donor`, 72, 290);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText(`${hero.donations} Verified Life-Saving Donations`, 72, 400);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText('“Every minute matters. Connect. Locate. Respond. Save.”', 72, 530);
  return canvas;
}

function makeInstagramStoryCard(hero: Hero) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#090d16');
  gradient.addColorStop(0.35, '#4c0519');
  gradient.addColorStop(0.8, '#0f172a');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Border frame
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, 1000, 1840);

  // Top branding
  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 46px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RAKTARUN HERO', 540, 220);

  ctx.fillStyle = '#fda4af';
  ctx.font = '30px Arial, sans-serif';
  ctx.fillText('COASTAL KARNATAKA EMERGENCY NETWORK', 540, 280);

  // Central Card Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.roundRect(100, 370, 880, 960, 40);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Donor Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '34px Arial, sans-serif';
  ctx.fillText('MEET OUR VERIFIED RESPONDER', 540, 460);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 74px Arial, sans-serif';
  ctx.fillText(hero.displayName, 540, 560);

  // Badges & Details
  ctx.font = 'bold 44px Arial, sans-serif';
  ctx.fillStyle = '#fb7185';
  ctx.fillText(`${hero.bloodGroup} Blood Donor`, 540, 680);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Emergency Response', 540, 760);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '38px Arial, sans-serif';
  ctx.fillText(`${hero.district} District`, 540, 840);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 46px Arial, sans-serif';
  ctx.fillText('Supported verified emergency cases', 540, 940);

  // Lifetime metrics
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 58px Arial, sans-serif';
  ctx.fillText(`${hero.donations} Life-Saving Donations`, 540, 1060);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText(`${hero.responses} Emergency Dispatches Answered`, 540, 1130);

  // Evocative Quote
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 52px Georgia, serif';
  ctx.fillText('“He didn’t just receive an alert.', 540, 1460);
  ctx.fillText('He responded.”', 540, 1540);

  // Footer Tagline
  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText('RaktaRun', 540, 1690);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '30px Arial, sans-serif';
  ctx.fillText('Connecting Lives When It Matters Most', 540, 1750);

  return canvas;
}

export default function HeroWallPage() {
  const { profile, role } = useAuth();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/heroes')
      .then(({ data }) => setHeroes(data.heroes))
      .catch(() => setError('Hero profiles are temporarily unavailable.'))
      .finally(() => setIsLoading(false));
  }, []);

  const totals = heroes.reduce((sum, hero) => ({ donations: sum.donations + hero.donations, responses: sum.responses + hero.responses }), { donations: 0, responses: 0 });

  const downloadCard = (hero: Hero, format: 'landscape' | 'story') => {
    if (!profile) {
      window.alert('Please log in to download verified RaktaRun recognition cards.');
      return;
    }
    const canvas = format === 'story' ? makeInstagramStoryCard(hero) : makeLandscapeCard(hero);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raktarun-hero-${hero.displayName.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      {role === 'donor' && (
        <Link
          to="/donor/hero-card"
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
        >
          <Camera className="h-3.5 w-3.5" /> My Hero Card Studio →
        </Link>
      )}
      <Badge variant="outline" className="border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10">
        <Sparkles className="h-3 w-3 mr-1 text-rose-500" /> Opt-In Recognition Only
      </Badge>
    </div>
  );

  return (
    <AppLayout
      title="RaktaRun Hero Wall"
      subtitle="Celebrating coastal Karnataka donors who responded when seconds counted"
      actions={headerActions}
      withSidebar={Boolean(profile)}
    >
      <div className="relative mx-auto max-w-7xl space-y-8 overflow-hidden rounded-[2rem] px-1 py-2 sm:px-3">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/20" />
        <div className="pointer-events-none absolute -left-28 top-72 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-amber-500/10" />

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white/80 via-rose-50/75 to-orange-100/50 p-6 shadow-[0_24px_90px_-45px_rgba(190,65,56,0.55)] backdrop-blur-2xl dark:border-white/10 dark:from-slate-900/75 dark:via-rose-950/35 dark:to-slate-900/65 sm:p-10">
          <div className="absolute -right-8 -top-16 h-64 w-64 rounded-full border border-white/50 bg-white/20 blur-[1px] dark:border-white/10" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/55 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-700 shadow-sm backdrop-blur-xl dark:border-rose-300/15 dark:bg-white/5 dark:text-rose-200">
                <Sparkles className="h-3.5 w-3.5" /> People who showed up
              </div>
              <h2 className="mt-5 text-4xl font-black leading-[1.04] tracking-[-0.06em] text-slate-900 dark:text-white sm:text-6xl">
                Real people.<br /><span className="bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-rose-300 dark:via-orange-200 dark:to-amber-200">Extraordinary impact.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Meet screened donors whose verified donations and emergency responses have helped their communities. Every profile is shared with the donor’s permission.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" /> Verified impact</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><Lock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" /> Privacy first</span>
              </div>
            </div>
            <div className="relative mx-auto flex w-full max-w-sm items-center justify-center py-3">
              <div className="absolute h-64 w-64 rounded-full bg-gradient-to-br from-rose-300/60 via-orange-200/50 to-amber-100/40 blur-2xl dark:from-rose-500/25 dark:via-orange-400/15 dark:to-transparent" />
              <div className="relative rotate-[-5deg] rounded-[2rem] border border-white/80 bg-white/50 p-5 shadow-[0_25px_65px_-30px_rgba(100,35,35,0.55)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/10">
                <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-500/25"><HeartPulse className="h-7 w-7" /></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Community heroes</p><p className="mt-1 text-lg font-black text-slate-900 dark:text-white">Impact, made human.</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><Droplets className="h-4 w-4 text-rose-600 dark:text-rose-300" /><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Verified donations</p><p className="text-sm font-bold text-slate-900 dark:text-white">{totals.donations.toLocaleString()} given</p></div>
                  <div className="rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><Users className="h-4 w-4 text-orange-600 dark:text-orange-300" /><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Emergency responses</p><p className="text-sm font-bold text-slate-900 dark:text-white">{totals.responses.toLocaleString()} answered</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Private Portal Callout Banner for Donors */}
        {role === 'donor' && (
          <div className="liquid-glass relative overflow-hidden rounded-2xl border border-rose-200/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-950/5 dark:border-rose-300/15">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Verified Donor Recognition Studio</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Access your private preview with live canvas rendering and high-res downloads.</p>
              </div>
            </div>
            <Link
              to="/donor/hero-card"
              className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
            >
              Open My Private Card Studio →
            </Link>
          </div>
        )}

        {/* Public Visitor Notice */}
        {!profile && (
          <div className="liquid-glass rounded-xl border border-white/70 p-4 flex items-center justify-between text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
            <span>Viewing public community wall. To download verified high-res shareable post cards, please log in.</span>
            <Link to="/login" className="text-rose-600 dark:text-rose-400 font-semibold hover:underline ml-2">Login here →</Link>
          </div>
        )}

        <div className="relative flex flex-wrap items-end justify-between gap-3 px-1">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">The people behind the impact</p><h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Community Heroes</h3></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real stories. Verified contributions.</p>
        </div>
        {error && <p role="alert" className="liquid-glass rounded-xl border border-rose-200/70 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:text-rose-300">{error}</p>}
        {isLoading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading community heroes">{[0, 1, 2].map((item) => <div key={item} className="liquid-glass h-64 animate-pulse rounded-[1.75rem] border border-white/70 dark:border-white/10" />)}</div>}
        {!isLoading && !error && heroes.length === 0 && (
          <div className="liquid-glass relative overflow-hidden rounded-[2rem] border border-white/70 p-10 text-center shadow-xl dark:border-white/10 sm:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-600/20"><Award className="h-8 w-8" /></div>
            <h4 className="mt-5 text-xl font-black text-slate-900 dark:text-white">The wall is ready for its first story.</h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">Donors who complete a verified donation and choose public recognition will appear here.</p>
            {!profile && <Link to="/register/donor" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:-translate-y-0.5">Become a donor <ArrowUpRight className="h-4 w-4" /></Link>}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((hero) => (
            <Card key={hero.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/45 p-0 shadow-[0_18px_55px_-32px_rgba(93,41,33,0.5)] backdrop-blur-2xl transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-35px_rgba(190,65,56,0.45)] dark:border-white/10 dark:bg-slate-900/45">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-rose-300/25 blur-3xl transition group-hover:bg-orange-300/30 dark:bg-rose-500/10" />
              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 rounded-[1.5rem] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-[3px] shadow-lg shadow-rose-600/15">
                      <div className="h-full w-full overflow-hidden rounded-[1.32rem] bg-white/80 dark:bg-slate-800">
                        {hero.profilePhotoUrl ? <img src={hero.profilePhotoUrl} alt={`${hero.displayName} profile`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100 text-2xl font-black text-rose-700 dark:from-rose-950 dark:to-orange-950 dark:text-rose-200">{hero.displayName.slice(0, 1).toUpperCase()}</div>}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow dark:border-slate-900"><ShieldCheck className="h-3.5 w-3.5" /></span>
                    </div>
                    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">Verified donor</p><h4 className="mt-1 truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">{hero.displayName}</h4><p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><MapPin className="h-3 w-3" />{hero.district} District</p></div>
                  </div>
                  <Badge variant="destructive" className="shrink-0 rounded-full px-3 py-1 font-black shadow-sm">{hero.bloodGroup}</Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><p className="text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">{hero.donations}</p><p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Verified donations</p></div>
                  <div className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><p className="text-2xl font-black tabular-nums text-orange-700 dark:text-orange-300">{hero.responses}</p><p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Emergency responses</p></div>
                </div>

                <div className="mt-4 flex min-h-8 flex-wrap gap-1.5">
                  {hero.badges.map((badge) => {
                    const info = BADGE_LABELS[badge] || { label: badge.replace(/_/g, ' '), icon: '✦' };
                    return <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-100/55 px-2.5 py-1 text-[10px] font-bold text-amber-800 backdrop-blur-lg dark:border-amber-200/15 dark:bg-amber-300/10 dark:text-amber-200"><span>{info.icon}</span>{info.label}</span>;
                  })}
                </div>
              </div>

              {/* Share / Download Actions: Authenticated vs Public Lock */}
              <div className="relative mt-auto border-t border-white/60 bg-white/25 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
                {profile ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadCard(hero, 'story')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-pink-500 transition"
                    >
                      <Camera className="h-3.5 w-3.5" /> Instagram Story (9:16)
                    </button>
                    <button
                      onClick={() => downloadCard(hero, 'landscape')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Landscape Banner
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-500" /> Login to Download Share Cards
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
