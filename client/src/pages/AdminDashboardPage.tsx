import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AppLayout } from '../components/AppLayout';
import {
  Shield,
  Building2,
  Users,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Download,
  Settings,
  Flag,
  RefreshCw,
  History,
  Calendar,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [config, setConfig] = useState({
    alertTimeoutSeconds: 120,
    radiusStepKm: 5,
    maxRadiusKm: 50,
    schedulerIntervalSeconds: 30,
  });
  const [configNotice, setConfigNotice] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // History states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{ summary?: any; history: any[] }>({ history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDistrictFilter, setHistoryDistrictFilter] = useState<'All' | 'Udupi' | 'Dakshina Kannada'>('All');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'fulfilled' | 'active' | 'unfulfilled'>('all');
  const [historySearch, setHistorySearch] = useState('');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/admin/history');
      setHistoryData(res.data);
    } catch (err) {
      console.error('Error fetching admin history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal]);

  // Flag suspicious activity state
  const [flagModal, setFlagModal] = useState(false);
  const [flagForm, setFlagForm] = useState({ entityType: 'donor', entityId: '', reason: 'Suspected false availability or no-show', notes: '' });
  const [flagNotice, setFlagNotice] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, auditRes, cfgRes, usersRes] = await Promise.all([
        api.get('/admin/telemetry'),
        api.get('/admin/audit-logs'),
        api.get('/admin/config'),
        api.get('/admin/users'),
      ]);
      setTelemetry(statsRes.data);
      setLogs(auditRes.data.logs);
      if (cfgRes.data) setConfig(cfgRes.data);
      if (usersRes.data?.users) setUsers(usersRes.data.users);
    } catch (e) {
      console.error('Admin telemetry or config error', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigNotice('');
    try {
      const { data } = await api.put('/admin/config', config);
      setConfig(data.config);
      setConfigNotice('Matching & escalation rules updated live!');
      setTimeout(() => setConfigNotice(''), 3500);
      loadData();
    } catch (err: any) {
      setConfigNotice('Failed to update system rules.');
    } finally {
      setSavingConfig(false);
    }
  };

  const submitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/flags', flagForm);
      setFlagNotice('Incident flagged and recorded in official audit logs.');
      setTimeout(() => {
        setFlagNotice('');
        setFlagModal(false);
      }, 2000);
      loadData();
    } catch (err: any) {
      setFlagNotice('Failed to record flag.');
    }
  };

  const exportCsv = () => {
    const token = localStorage.getItem('lifepulse_token');
    const url = `${api.defaults.baseURL || 'http://localhost:5000/api'}/admin/reports/export`;
    // Trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `raktarun-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
      })
      .catch((err) => console.error('Export failed', err));
  };

  return (
    <AppLayout
      title="District Verification & Governance"
      subtitle="Live dispatch governance, matching rule configurations, and audit telemetry."
      actions={
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
          <button
            onClick={() => setFlagModal(true)}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition shadow-sm active:scale-95 sm:px-3.5"
          >
            <Flag className="h-3.5 w-3.5" /> Flag Suspicious Activity
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm active:scale-95 sm:px-3.5"
          >
            <History className="h-3.5 w-3.5 text-rose-500" /> Audit History
          </button>
          <button
            onClick={exportCsv}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/20 hover:bg-rose-500 transition active:scale-95 sm:px-3.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Audit Logs (CSV)
          </button>
          <button
            onClick={loadData}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm active:scale-95 sm:px-3.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" /> Refresh Telemetry
          </button>
        </div>
      }
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 sm:space-y-8">

        {/* Phase 1 Core Action Modules (Blocks F, I & History) */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-10 sm:gap-6 lg:grid-cols-3">
          {/* Block F Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 shadow-xl flex flex-col justify-between sm:p-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
                  Block F
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Hospital Accreditation Auditing</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Review pending blood bank licenses, verify emergency contacts, and approve hospital authorities to dispatch emergency requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold">{telemetry?.totals?.hospitals ?? 3} Facilities Registered</span>
              <Link
                to="/admin/hospitals"
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
              >
                Open Audit Portal <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Block I Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 shadow-xl flex flex-col justify-between sm:p-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  Block I
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Donor Certificate Verification</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Audit uploaded hospital digital screening certificates, verify donor vitals (Hb, weight), and activate donor eligibility for emergency matching.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-blue-400 font-semibold">{telemetry?.totals?.verifiedDonors ?? 5} Screened Donors</span>
              <Link
                to="/admin/donors"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
              >
                Inspect Certificates <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Network Dispatch History Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 shadow-xl flex flex-col justify-between sm:p-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <History className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
                  Audit Trail
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Network Dispatch & Donation History</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Audit complete emergency dispatch logs across Udupi and Dakshina Kannada, fulfilled transfusions, and hero donor completions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-rose-400 font-semibold">{telemetry?.totals?.completedDonations ?? 7} Donations Recorded</span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition active:scale-[0.98]"
              >
                Inspect Audit Trail <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Accredited Hospitals</span>
              <Building2 className="h-4 w-4 shrink-0 text-rose-500 sm:h-5 sm:w-5" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{telemetry?.totals.hospitals ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-emerald-600 dark:text-emerald-400">Udupi & Dakshina Kannada</span>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Verified Donors</span>
              <Users className="h-4 w-4 shrink-0 text-blue-500 sm:h-5 sm:w-5" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{telemetry?.totals.verifiedDonors ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-blue-600 dark:text-blue-400">Hospital Screened</span>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Active Requests</span>
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 sm:h-5 sm:w-5" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{telemetry?.totals.activeRequests ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-amber-600 dark:text-amber-400">Across both districts</span>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Completed Donations</span>
              <Shield className="h-4 w-4 shrink-0 text-emerald-500 sm:h-5 sm:w-5" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{telemetry?.totals.completedDonations ?? '—'}</p>
            <span className="mt-1 inline-block text-xs text-emerald-600 dark:text-emerald-400">Fulfilled Dispatches</span>
          </div>
        </div>

        {/* Section 2: Matching & Auto-Escalation Rule Configuration Console */}
        <section className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-xl sm:mt-10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-rose-500" /> Matching & Escalation Rule Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure alert response timeout windows, radius expansion step increments, and auto-escalation ceiling parameters.
              </p>
            </div>
            {configNotice && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{configNotice}</span>}
          </div>

          <form onSubmit={saveConfig} className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alert Timeout (Seconds)</label>
              <input
                type="number"
                min="30"
                max="600"
                value={config.alertTimeoutSeconds}
                onChange={(e) => setConfig({ ...config, alertTimeoutSeconds: Number(e.target.value) })}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-xs text-slate-500">Currently: {config.alertTimeoutSeconds / 60} minutes</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Radius Expansion Step (km)</label>
              <input
                type="number"
                min="1"
                max="25"
                value={config.radiusStepKm}
                onChange={(e) => setConfig({ ...config, radiusStepKm: Number(e.target.value) })}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-xs text-slate-500">+ {config.radiusStepKm} km every cycle</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Radius Ceiling (km)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.maxRadiusKm}
                onChange={(e) => setConfig({ ...config, maxRadiusKm: Number(e.target.value) })}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-xs text-slate-500">Ceiling limit across coastal belt</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-950">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduler Loop (Seconds)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={config.schedulerIntervalSeconds}
                onChange={(e) => setConfig({ ...config, schedulerIntervalSeconds: Number(e.target.value) })}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={savingConfig}
                className="mt-3 w-full rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition shadow-sm"
              >
                {savingConfig ? 'Saving…' : 'Save Rules Live'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 3: Registered Users Directory */}
        <section className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:mt-8 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" /> System Users Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">All authenticated system accounts across administrator, hospital, and donor roles.</p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{users.length} accounts total</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 md:hidden">
            {users.map((u) => (
              <article key={u.uid} className="min-w-0 space-y-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-sm font-semibold text-slate-900 dark:text-white">{u.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' :
                    u.role === 'hospital' ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                    'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">{u.email}</p>
                <p className="break-words text-xs text-slate-500 dark:text-slate-400">
                  {u.phone || 'No phone'} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'No registration date'}
                </p>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 uppercase font-semibold dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        u.role === 'admin' ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' :
                        u.role === 'hospital' ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                        'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: District Telemetry & Audit Trail */}
        <section className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:mt-8 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">District Pilot Telemetry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Operational active dispatches categorized by district.</p>
            </div>
            <span className="text-xs text-slate-500">{telemetry?.totals?.donorsEnRoute ?? 0} donors en route</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(telemetry?.byDistrict || []).map((row: any) => (
              <div key={row.district} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-white">{row.district}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{row.activeRequests} active emergency dispatches</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent System Audit Events</h3>
            <button onClick={loadData} className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {logs.slice(0, 20).map((log: any) => (
              <div key={log.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="text-slate-800 dark:text-slate-200">
                  <strong className="text-rose-600 dark:text-rose-400 font-mono text-xs">{log.action}</strong>
                  <span className="text-slate-500 text-xs"> · actor: {log.actorRole} ({log.entityType}: {log.entityId})</span>
                </span>
                <time className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</time>
              </div>
            ))}
            {logs.length === 0 && <p className="py-3 text-sm text-slate-500">No audit events recorded yet.</p>}
          </div>
        </section>
      </div>

      {/* Flag Suspicious Activity Modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/90 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-white text-slate-900 dark:bg-slate-900 dark:text-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-500 dark:text-amber-400" /> Flag Suspicious Activity / Misuse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Record a verified incident in the permanent audit trail.</p>

            <form onSubmit={submitFlag} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300">Entity Type</label>
                <select
                  value={flagForm.entityType}
                  onChange={(e) => setFlagForm({ ...flagForm, entityType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="donor">Donor (No-show or fake credentials)</option>
                  <option value="hospital">Hospital (Invalid emergency alert)</option>
                  <option value="bloodRequest">Blood Request (Spam / Fake request)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300">Entity ID / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. donor_rahul_01 or req_emergency_001"
                  value={flagForm.entityId}
                  onChange={(e) => setFlagForm({ ...flagForm, entityId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300">Reason</label>
                <input
                  type="text"
                  required
                  value={flagForm.reason}
                  onChange={(e) => setFlagForm({ ...flagForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300">Investigation Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes from clinical officer or administrator…"
                  value={flagForm.notes}
                  onChange={(e) => setFlagForm({ ...flagForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {flagNotice && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{flagNotice}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-sm"
                >
                  Record Flag in Audit Trail
                </button>
                <button
                  type="button"
                  onClick={() => setFlagModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Network Dispatch & Donation History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Network Dispatch & Donation Audit History
                    <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                      Coastal Karnataka Network
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive chronological record of all emergency dispatches, hospital alerts, and completed donor handoffs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Dispatches</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                    {historyData.summary?.totalDispatches ?? historyData.history.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Across network</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Fulfilled Requests</p>
                  <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">
                    {historyData.summary?.fulfilled ?? 0}
                  </p>
                  <p className="text-[11px] text-emerald-500 mt-0.5">Completed handoffs</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-semibold">Active Dispatches</p>
                  <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-300">
                    {historyData.summary?.active ?? 0}
                  </p>
                  <p className="text-[11px] text-amber-500 mt-0.5">Searching or matched</p>
                </div>
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="text-xs text-rose-600 dark:text-rose-400 uppercase font-semibold">Units Donated</p>
                  <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-300">
                    {historyData.summary?.totalDonations ?? 0}
                  </p>
                  <p className="text-[11px] text-rose-500 mt-0.5">Verified units saved</p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">District:</span>
                  {(['All', 'Udupi', 'Dakshina Kannada'] as const).map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setHistoryDistrictFilter(dist)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        historyDistrictFilter === dist
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-1 ml-2">Status:</span>
                  {(['all', 'fulfilled', 'active', 'unfulfilled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setHistoryStatusFilter(st)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                        historyStatusFilter === st
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search hospital or blood group…"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* History Records List */}
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-rose-500" />
                  <p className="mt-2 text-sm font-semibold">Loading network dispatch history…</p>
                </div>
              ) : (
                (() => {
                  const filtered = (historyData.history || []).filter((item: any) => {
                    if (
                      historyDistrictFilter !== 'All' &&
                      !item.district?.toLowerCase().includes(historyDistrictFilter.toLowerCase())
                    ) {
                      return false;
                    }
                    if (historyStatusFilter === 'fulfilled' && item.status !== 'fulfilled') return false;
                    if (historyStatusFilter === 'active' && !['searching', 'matched'].includes(item.status)) return false;
                    if (historyStatusFilter === 'unfulfilled' && item.status !== 'unfulfilled') return false;
                    if (historySearch.trim()) {
                      const q = historySearch.toLowerCase();
                      const match =
                        item.hospitalName?.toLowerCase().includes(q) ||
                        item.bloodGroup?.toLowerCase().includes(q) ||
                        item.id?.toLowerCase().includes(q) ||
                        item.district?.toLowerCase().includes(q);
                      if (!match) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                        <History className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="font-semibold text-slate-900 dark:text-white">No dispatches match the selected filters.</p>
                        <p className="text-xs text-slate-500 mt-1">Try switching district or status filters.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((item: any) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 font-black text-rose-600 border border-rose-500/20 text-sm dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                                {item.bloodGroup}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.hospitalName}</h4>
                                  <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800 dark:text-slate-300">
                                    {item.district}
                                  </span>
                                  {item.urgency === 'critical' && (
                                    <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 animate-pulse">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span>ID: <code className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{item.id}</code></span>
                                  <span>•</span>
                                  <span>Component: <strong className="text-slate-800 dark:text-white capitalize">{item.component}</strong></span>
                                  <span>•</span>
                                  <span>Required: <strong className="text-slate-800 dark:text-white">{item.unitsRequired} unit(s)</strong></span>
                                  <span>•</span>
                                  <span>Fulfilled: <strong className="text-emerald-600 dark:text-emerald-400">{item.unitsDonated} unit(s)</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                                  item.status === 'fulfilled'
                                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : item.status === 'unfulfilled'
                                    ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>

                          {/* Donor Completion Sub-List if any */}
                          {item.donors && item.donors.length > 0 && (
                            <div className="mt-3 border-t border-slate-200 dark:border-slate-900 pt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Donors Who Fulfilled ({item.donors.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.donors.map((d: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300"
                                  >
                                    <span className="font-medium">{d.fullName}</span>
                                    {d.bloodGroup && (
                                      <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[10px] font-bold">
                                        {d.bloodGroup}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      ({new Date(d.donatedAt).toLocaleDateString()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created: {new Date(item.createdAt).toLocaleString()}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              Alerted: {item.totalAlerted} | Accepted: {item.totalAccepted}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                RaktaRun Emergency Dispatch System · Audit Logs Synchronized
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2 text-xs font-semibold transition dark:border-transparent dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminDashboardPage;
