import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, MapPin, Send, Users, XCircle } from 'lucide-react';
import api from '../utils/api';
import { Card } from './ui/Card';

interface BloodCamp {
  id: string;
  hospitalName: string;
  title: string;
  message: string;
  address: string;
  radiusKm: number;
  startsAt: string;
  status: 'active' | 'cancelled';
  distanceKm?: number;
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export function BloodCampManager() {
  const [camps, setCamps] = useState<BloodCamp[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/blood-camps/mine');
      setCamps(Array.isArray(data) ? data : []);
    } catch {
      setNotice('Could not load blood camps.');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      const { data } = await api.post('/blood-camps', { title, message, startsAt: new Date(startsAt).toISOString(), radiusKm });
      setCamps((current) => [data.camp, ...current]);
      setTitle('');
      setMessage('');
      setStartsAt('');
      setNotice(`Camp posted. Nearby donors are being notified (${data.recipientsNotified} in range).`);
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'Could not post this blood camp.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (campId: string) => {
    try {
      await api.delete(`/blood-camps/${campId}`);
      setCamps((current) => current.map((camp) => camp.id === campId ? { ...camp, status: 'cancelled' } : camp));
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'Could not cancel this camp.');
    }
  };

  return (
    <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900/50 dark:bg-slate-900/70 sm:p-6">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-rose-600 dark:text-rose-400" /><h2 className="text-base font-bold text-slate-900 dark:text-white">Blood donation camps</h2></div>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Share a local camp announcement with eligible nearby donors in a 5 or 10 km radius.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Camp title
          <input required minLength={4} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Community blood donation camp" className={`${inputClass} mt-1.5`} />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Starts at
          <input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={`${inputClass} mt-1.5`} />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notify donors within
          <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} className={`${inputClass} mt-1.5`}><option value={5}>5 km</option><option value={10}>10 km</option></select>
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">Message
          <textarea required minLength={10} maxLength={1000} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell donors about the camp and how to take part." className={`${inputClass} mt-1.5 resize-y`} />
        </label>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          {notice && <p role="status" className="text-xs font-medium text-rose-700 dark:text-rose-300">{notice}</p>}
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:ml-auto"><Send className="h-4 w-4" />{busy ? 'Sending…' : 'Post camp & notify donors'}</button>
        </div>
      </form>
      {camps.length > 0 && <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your camp announcements</h3>
        {camps.slice().reverse().map((camp) => <article key={camp.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-bold text-slate-900 dark:text-white">{camp.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(camp.startsAt).toLocaleString()} · {camp.radiusKm} km · {camp.status}</p></div>
          {camp.status === 'active' && <button type="button" onClick={() => void cancel(camp.id)} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"><XCircle className="h-3.5 w-3.5" />Cancel</button>}
        </article>)}
      </div>}
    </section>
  );
}

export function NearbyBloodCamps() {
  const [camps, setCamps] = useState<BloodCamp[]>([]);
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/blood-camps/nearby');
      setCamps(Array.isArray(data) ? data : []);
    } catch { /* Leave the dashboard usable if camp announcements are unavailable. */ }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => clearInterval(timer);
  }, [refresh]);

  if (!camps.length) return null;
  return <section className="space-y-3 rounded-3xl border border-amber-300/70 bg-amber-50/80 p-5 dark:border-amber-800/70 dark:bg-amber-950/20 sm:p-6">
    <div className="flex items-center gap-2"><Users className="h-5 w-5 text-amber-700 dark:text-amber-300" /><div><h2 className="text-base font-bold text-slate-900 dark:text-white">Blood camps near you</h2><p className="text-xs text-slate-600 dark:text-slate-300">Local announcements from RaktaRun hospitals and blood banks.</p></div></div>
    <div className="grid gap-3 md:grid-cols-2">
      {camps.map((camp) => <Card key={camp.id} className="p-4 dark:bg-slate-950/60">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{camp.title}</p>
        <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-300">{camp.hospitalName} · {camp.distanceKm} km away</p>
        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{camp.message}</p>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><CalendarDays className="h-3.5 w-3.5" />{new Date(camp.startsAt).toLocaleString()}</p>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.address)}&travelmode=driving`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"><MapPin className="h-3.5 w-3.5" />Get directions</a>
      </Card>)}
    </div>
  </section>;
}
