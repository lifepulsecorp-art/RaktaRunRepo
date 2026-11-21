import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, HeartPulse, MapPin, ShieldCheck, Users } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';

const founders = [
  { name: 'Maneesh Bailady', number: '01' },
  { name: 'Pratheek S Shetty', number: '02' },
  { name: 'Sudeep Shetty', number: '03' },
  { name: 'Banish Devadiga', number: '04' },
];

export default function AboutPage() {
  const [activeFounder, setActiveFounder] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActiveFounder((current) => (current + 1) % founders.length), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const founder = founders[activeFounder];

  return (
    <AppLayout withSidebar={false}>
      <div className="mx-auto max-w-6xl space-y-10 py-4 sm:py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-200"><HeartPulse className="h-4 w-4" /> About RaktaRun</span>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">A nearby donor can change everything.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80">
              RaktaRun connects hospitals, blood banks and screened donors across coastal Karnataka. The network helps care teams share urgent needs with eligible donors close to the facility.
            </p>
            <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500">Join the network <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPin, title: 'Local by design', text: 'Location based matching helps keep urgent requests close to the people who can respond.' },
            { icon: ShieldCheck, title: 'Screened and reviewed', text: 'Donor and healthcare authority applications go through verification before emergency access.' },
            { icon: Users, title: 'Community powered', text: 'Hospitals, blood banks, donors and their neighbors all have a part in the network.' },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <Icon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="founder-carousel relative overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-xl sm:p-10 dark:border-white/10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
          <div className="relative mb-5 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">The founding team</span>
            <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Four co-founders from NMAMIT</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Meet the student team behind a more connected local blood donor network.</p>
          </div>
          <div className="relative grid gap-6 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
            <div className="founder-portrait mx-auto flex aspect-square w-full max-w-[17rem] items-center justify-center rounded-[2rem] text-6xl font-black text-rose-700 dark:text-rose-200" aria-hidden="true">{founder.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
            <div key={founder.name} className="founder-slide py-4 sm:py-8" aria-live="polite" aria-atomic="true">
              <span className="text-xs font-black tracking-[0.2em] text-rose-600 dark:text-rose-400">CO-FOUNDER {founder.number} / 04</span>
              <h3 className="mt-3 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">{founder.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">NMAMIT · Founding team</p>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 dark:text-slate-300">Part of the student team building RaktaRun to help connect nearby donors with hospitals across coastal Karnataka.</p>
              <div className="mt-7 flex items-center gap-4">
                <button type="button" aria-label="Previous co-founder" onClick={() => setActiveFounder((activeFounder + founders.length - 1) % founders.length)} className="founder-control"><ArrowLeft className="h-4 w-4" /></button>
                <button type="button" aria-label="Next co-founder" onClick={() => setActiveFounder((activeFounder + 1) % founders.length)} className="founder-control"><ArrowRight className="h-4 w-4" /></button>
                <div className="ml-1 flex gap-2" aria-label={`Co-founder ${activeFounder + 1} of ${founders.length}`}>
                  {founders.map((person, index) => <button key={person.name} type="button" aria-label={`Show ${person.name}`} aria-current={index === activeFounder ? 'true' : undefined} onClick={() => setActiveFounder(index)} className={`founder-dot ${index === activeFounder ? 'is-active' : ''}`} />)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20 sm:p-9">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">A little care can go a long way.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Help strengthen the local network by registering as a donor or healthcare authority.</p>
          <Link to="/register" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700">Get started <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </AppLayout>
  );
}
