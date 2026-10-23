import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { Badge } from '../../components/ui/Badge';

interface Donor {
  id: string;
  fullName: string;
  phone: string;
  bloodGroup: string;
  rhType: string;
  bloodComponentEligibility: string[];
  hemoglobinLevel: number;
  weight: number;
  eligibilityStatus: 'pending' | 'eligible' | 'temporary_deferral' | 'permanent_deferral';
  deferralReason?: string | null;
  homeLocality: string;
  verification: {
    hospitalId: string;
    hospitalName: string;
    certificateId: string;
    verifiedAt: string;
    verifiedBy: string;
    certificateFileName?: string;
    expiryDate: string;
    aiReview?: {
      status: 'passed' | 'failed' | 'unavailable';
      summary: string;
      confidence: number;
      checkedAt: string;
      model?: string;
    };
  };
}

export const AdminDonorsPage: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [certificateInProgress, setCertificateInProgress] = useState<string | null>(null);
  const [aiReviewInProgress, setAiReviewInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDonors = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/donors');
      setDonors(res.data);
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setMessage({ type: 'error', text: 'Could not fetch donors from backend.' });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDonors();
    const refreshTimer = window.setInterval(() => void fetchDonors(false), 15_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const handleViewCertificate = async (donorId: string) => {
    const certificateWindow = window.open('about:blank', '_blank');
    if (!certificateWindow) {
      setMessage({ type: 'error', text: 'Allow pop-ups to open the certificate document.' });
      return;
    }

    setCertificateInProgress(donorId);
    setMessage(null);
    try {
      const { data, headers } = await api.get(`/admin/donors/${encodeURIComponent(donorId)}/certificate`, {
        responseType: 'blob',
      });
      const certificateUrl = URL.createObjectURL(new Blob([data], {
        type: String(headers['content-type'] || 'application/octet-stream'),
      }));
      certificateWindow.location.href = certificateUrl;
      window.setTimeout(() => URL.revokeObjectURL(certificateUrl), 60_000);
    } catch (error: any) {
      certificateWindow.close();
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Certificate document could not be opened. Confirm that the file exists on the server.',
      });
    } finally {
      setCertificateInProgress(null);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    eligibilityStatus: 'pending' | 'eligible' | 'temporary_deferral' | 'permanent_deferral',
    deferralReason?: string
  ) => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await api.put(`/donors/${id}/verify`, { eligibilityStatus, deferralReason });
      setMessage({
        type: 'success',
        text: `Donor eligibility updated to "${eligibilityStatus}".`,
      });
      await fetchDonors();
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update donor eligibility.' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAiReview = async (donorId: string) => {
    setAiReviewInProgress(donorId);
    setMessage(null);
    try {
      const { data } = await api.post(`/admin/donors/${encodeURIComponent(donorId)}/review-certificate`);
      const status = data.aiReview?.status;
      setMessage({
        type: status === 'passed' ? 'success' : 'error',
        text: status === 'passed'
          ? 'AI review passed its document checks. Admin approval is still required to activate alerts.'
          : status === 'failed'
            ? 'AI review could not confirm the certificate. Admin review is still available.'
            : 'AI review is unavailable. Admin review is still available.',
      });
      await fetchDonors();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Could not review the certificate with AI.' });
    } finally {
      setAiReviewInProgress(null);
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchesGroup = filterBloodGroup === 'All' || d.bloodGroup === filterBloodGroup;
    const matchesStatus = filterStatus === 'All' || d.eligibilityStatus === filterStatus;
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.homeLocality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.verification?.certificateId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesStatus && matchesSearch;
  });

  const headerActions = (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      <Link
        to="/admin/hospitals"
        className="min-w-0 whitespace-normal rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm sm:whitespace-nowrap"
      >
        Go to Hospital Accreditation (Block F) →
      </Link>
      <Badge variant="outline" className="w-fit border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
        Live Audit Mode
      </Badge>
    </div>
  );

  return (
    <AppLayout
      title="Donor Certificate Audit Portal"
      subtitle="RaktaRun Medical Authority • Block I Medical Screening Verification"
      actions={headerActions}
      withSidebar={true}
    >
      <div className="w-full min-w-0 space-y-5 sm:space-y-6">
        {message && (
          <div
            className={`mb-6 flex min-w-0 items-start justify-between gap-3 rounded-xl border p-3 text-sm sm:p-4 ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
            }`}
          >
            <span className="min-w-0 break-words">{message.text}</span>
            <button onClick={() => setMessage(null)} className="shrink-0 text-xs opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="mb-5 flex w-full min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search donor name, certificate ID, phone, or town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-rose-500 focus:outline-none transition shadow-sm"
            />
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-rose-500 focus:outline-none shadow-sm sm:w-auto sm:px-3"
            >
              <option value="All">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-rose-500 focus:outline-none shadow-sm sm:w-auto sm:px-3"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending Verification</option>
              <option value="eligible">Eligible (Active)</option>
              <option value="temporary_deferral">Temporary Deferral</option>
              <option value="permanent_deferral">Permanent Deferral</option>
            </select>

            <button
              onClick={() => void fetchDonors()}
              disabled={loading}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm sm:col-span-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Donors Table */}
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl backdrop-blur-md">
          {loading && donors.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
              <p className="mt-3 text-sm">Loading donor medical records...</p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Heart className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-300">No donor records matched</p>
            </div>
          ) : (
            <>
            <div className="divide-y divide-slate-100 p-3 dark:divide-slate-800/60 md:hidden">
              {filteredDonors.map((d) => {
                const isEligible = d.eligibilityStatus === 'eligible';
                const isUpdating = actionInProgress === d.id;
                const aiReview = d.verification?.aiReview;

                return (
                  <article key={d.id} className="min-w-0 space-y-3 py-4 first:pt-1 last:pb-1">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-sm font-black text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                          {d.bloodGroup}
                        </span>
                        <div className="min-w-0">
                          <h2 className="break-words text-base font-bold text-slate-900 dark:text-white">{d.fullName}</h2>
                          <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{d.phone} · {d.homeLocality}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${isEligible
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {isEligible ? 'Eligible' : d.eligibilityStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
                      <p><span className="text-slate-500">Hemoglobin:</span> <strong className="text-slate-900 dark:text-white">{d.hemoglobinLevel} g/dL</strong></p>
                      <p><span className="text-slate-500">Weight:</span> <strong className="text-slate-900 dark:text-white">{d.weight} kg</strong></p>
                      <div className="col-span-2 flex flex-wrap gap-1">
                        {d.bloodComponentEligibility?.map((component) => (
                          <span key={component} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{component}</span>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1 text-xs">
                      <p className="flex min-w-0 items-start gap-1.5 break-all font-mono font-bold text-slate-900 dark:text-white">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" /> {d.verification?.certificateId}
                      </p>
                      <p className="break-words text-slate-600 dark:text-slate-400">{d.verification?.hospitalName}</p>
                      <p className="break-words text-[11px] text-slate-500">Screener: {d.verification?.verifiedBy}</p>
                      {d.deferralReason && <p className="break-words text-[11px] text-amber-700 dark:text-amber-300">Reason: {d.deferralReason}</p>}
                      {aiReview && (
                        <div className="rounded-lg bg-indigo-50 p-2 text-[11px] text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                          <span className="font-semibold">AI check {aiReview.status}:</span> <span className="break-words">{aiReview.summary}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <button
                          type="button"
                          onClick={() => void handleAiReview(d.id)}
                          disabled={!d.verification?.certificateFileName || aiReviewInProgress === d.id}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-white"
                        >
                          <Sparkles className="h-3 w-3" /> {aiReviewInProgress === d.id ? 'Checking…' : 'Recheck with AI'}
                        </button>
                        {d.verification?.certificateFileName && (
                          <button
                            type="button"
                            onClick={() => handleViewCertificate(d.id)}
                            disabled={certificateInProgress === d.id}
                            className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400"
                          >
                            <ExternalLink className="h-3 w-3" /> {certificateInProgress === d.id ? 'Opening…' : 'View certificate'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {isEligible ? (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'temporary_deferral', 'Temporary health deferral')}
                          disabled={isUpdating}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        >
                          Defer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'eligible')}
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Approve & Activate
                        </button>
                      )}
                      <button
                        aria-label="Disqualify donor"
                        onClick={() => handleUpdateStatus(d.id, 'permanent_deferral', 'Permanent deferral')}
                        disabled={isUpdating}
                        className="flex w-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-rose-600 shadow-sm transition disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400"
                        title="Disqualify"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Donor & Group</th>
                    <th className="px-6 py-4">Vitals & Components</th>
                    <th className="px-6 py-4">Hospital Certificate</th>
                    <th className="px-6 py-4">Eligibility Status</th>
                    <th className="px-6 py-4 text-right">Admin Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                  {filteredDonors.map((d) => {
                    const isEligible = d.eligibilityStatus === 'eligible';
                    const isUpdating = actionInProgress === d.id;

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                        {/* Name and Group */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/20 font-black text-rose-600 dark:text-rose-400 text-sm">
                              {d.bloodGroup}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-base">{d.fullName}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.phone} • {d.homeLocality}</div>
                            </div>
                          </div>
                        </td>

                        {/* Vitals */}
                        <td className="px-6 py-4 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Hb:</span>{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">{d.hemoglobinLevel} g/dL</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-500 dark:text-slate-400">Weight:</span>{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">{d.weight} kg</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {d.bloodComponentEligibility?.map((c) => (
                              <span key={c} className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-transparent">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Certificate Details */}
                        <td className="px-6 py-4 text-xs">
                          <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                            {d.verification?.certificateId}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 mt-1">{d.verification?.hospitalName}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">Screener: {d.verification?.verifiedBy}</div>
                          {d.verification?.aiReview && (
                            <div className="mt-2 max-w-xs">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${
                                d.verification.aiReview.status === 'passed'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : d.verification.aiReview.status === 'failed'
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                              }`}>
                                <Sparkles className="h-3 w-3" />
                                {d.verification.aiReview.status === 'passed' ? 'AI check passed' : d.verification.aiReview.status === 'failed' ? 'AI check failed' : 'AI check unavailable'}
                              </span>
                              <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{d.verification.aiReview.summary}</p>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleAiReview(d.id)}
                            disabled={!d.verification?.certificateFileName || aiReviewInProgress === d.id}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-white"
                          >
                            <Sparkles className="h-3 w-3" />
                            {aiReviewInProgress === d.id ? 'Checking certificate…' : 'Recheck with AI'}
                          </button>
                          {d.verification?.certificateFileName && (
                            <button
                              type="button"
                              onClick={() => handleViewCertificate(d.id)}
                              disabled={certificateInProgress === d.id}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {certificateInProgress === d.id ? 'Opening certificate…' : 'View Certificate Document'}
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Eligible for Alerts
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                <Clock className="h-3.5 w-3.5" /> {d.eligibilityStatus.replace(/_/g, ' ')}
                              </span>
                              {d.deferralReason && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{d.deferralReason}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Audit Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEligible ? (
                              <button
                                onClick={() => handleUpdateStatus(d.id, 'temporary_deferral', 'Temporary health deferral')}
                                disabled={isUpdating}
                                className="rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition disabled:opacity-50"
                              >
                                Defer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(d.id, 'eligible')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Approve & Activate
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateStatus(d.id, 'permanent_deferral', 'Permanent deferral')}
                              disabled={isUpdating}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition disabled:opacity-50 shadow-sm"
                              title="Disqualify"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDonorsPage;

