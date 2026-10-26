import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { Badge } from '../../components/ui/Badge';

interface Hospital {
  id: string;
  name: string;
  address: string;
  district: string;
  coordinates: { latitude: number; longitude: number };
  verificationStatus: 'verified' | 'pending' | 'rejected';
  bloodBankContact: {
    name: string;
    phone: string;
    email: string;
  };
  licenseNumber: string;
  registrationNumber: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export const AdminHospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err: any) {
      console.error('Failed to load hospitals:', err);
      setMessage({ type: 'error', text: 'Could not fetch hospitals from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleVerify = async (id: string, newStatus: 'verified' | 'rejected') => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await api.put(`/hospitals/${id}/verify`, { status: newStatus });
      setMessage({
        type: 'success',
        text: `Hospital status updated to "${newStatus}".`,
      });
      await fetchHospitals();
    } catch (err: any) {
      console.error('Verification error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update hospital status.' });
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchesDistrict = filterDistrict === 'All' || h.district === filterDistrict;
    const matchesStatus = filterStatus === 'All' || h.verificationStatus === filterStatus;
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesStatus && matchesSearch;
  });

  const headerActions = (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      <Link
        to="/admin/donors"
        className="min-w-0 whitespace-normal rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm sm:whitespace-nowrap"
      >
        Go to Donor Verification (Block I) →
      </Link>
      <Badge variant="outline" className="w-fit border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
        Live Audit Mode
      </Badge>
    </div>
  );

  return (
    <AppLayout
      title="Hospital Accreditation Auditing"
      subtitle="RaktaRun Medical Authority • Block F Clinical Verification"
      actions={headerActions}
      withSidebar={true}
    >
      <div className="w-full min-w-0 space-y-6">
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm flex items-center justify-between ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="mb-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              aria-label="Search by hospital name, license, or address"
              placeholder="Search hospitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-rose-500 focus:outline-none transition shadow-sm"
            />
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-rose-500 focus:outline-none shadow-sm sm:w-auto sm:px-3"
            >
              <option value="All">All Districts</option>
              <option value="Udupi">Udupi District</option>
              <option value="Dakshina Kannada">Dakshina Kannada</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-rose-500 focus:outline-none shadow-sm sm:w-auto sm:px-3"
            >
              <option value="All">All Statuses</option>
              <option value="verified">Verified (Approved)</option>
              <option value="pending">Pending Audit</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchHospitals}
              disabled={loading}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm sm:col-span-1"
              title="Refresh records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Hospitals Table */}
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl backdrop-blur-md">
          {loading && hospitals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
              <p className="mt-3 text-sm">Loading hospital accreditations...</p>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-300">No hospitals matched your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting the district or search query</p>
            </div>
          ) : (
            <>
            <div className="divide-y divide-slate-100 p-3 dark:divide-slate-800/60 md:hidden">
              {filteredHospitals.map((h) => {
                const isVerified = h.verificationStatus === 'verified';
                const isUpdating = actionInProgress === h.id;

                return (
                  <article key={h.id} className="min-w-0 space-y-3 py-4 first:pt-1 last:pb-1">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-bold text-slate-900 dark:text-white">{h.name}</h2>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-slate-500">ID: {h.id}</p>
                      </div>
                      {isVerified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Accredited
                        </span>
                      ) : h.verificationStatus === 'pending' ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" /> {h.district}
                        </p>
                        <p className="mt-1 break-words text-slate-600 dark:text-slate-400">{h.address}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          {h.coordinates?.latitude.toFixed(4)}, {h.coordinates?.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="break-words"><span className="text-slate-500">License:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{h.licenseNumber}</span></p>
                        <p className="break-words"><span className="text-slate-500">Reg:</span> <span className="font-mono text-slate-600 dark:text-slate-400">{h.registrationNumber}</span></p>
                      </div>
                      <div className="min-w-0 sm:col-span-2">
                        <p className="break-words font-medium text-slate-900 dark:text-slate-200">{h.bloodBankContact?.name}</p>
                        <p className="mt-1 flex min-w-0 items-start gap-1 break-all text-slate-600 dark:text-slate-400">
                          <Phone className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {h.bloodBankContact?.phone}
                        </p>
                        <p className="mt-1 flex min-w-0 items-start gap-1 break-all text-slate-600 dark:text-slate-400">
                          <Mail className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {h.bloodBankContact?.email}
                        </p>
                      </div>
                    </div>

                    {isVerified ? (
                      <button
                        onClick={() => handleVerify(h.id, 'rejected')}
                        disabled={isUpdating}
                        className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        Revoke Approval
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(h.id, 'verified')}
                        disabled={isUpdating}
                        className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Approve Accreditation
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Hospital Details</th>
                    <th className="px-6 py-4">District & Location</th>
                    <th className="px-6 py-4">Licenses & Registration</th>
                    <th className="px-6 py-4">Blood Bank Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                  {filteredHospitals.map((h) => {
                    const isPending = h.verificationStatus === 'pending';
                    const isVerified = h.verificationStatus === 'verified';
                    const isUpdating = actionInProgress === h.id;

                    return (
                      <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                        {/* Name and ID */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-base">{h.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {h.id}</div>
                        </td>

                        {/* District & Location */}
                        <td className="px-6 py-4 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                            {h.district}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 max-w-xs">{h.address}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            {h.coordinates?.latitude.toFixed(4)}, {h.coordinates?.longitude.toFixed(4)}
                          </div>
                        </td>

                        {/* Licenses */}
                        <td className="px-6 py-4 text-xs">
                          <div>
                            <span className="text-slate-500">License:</span>{' '}
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{h.licenseNumber}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-500">Reg:</span>{' '}
                            <span className="font-mono text-slate-600 dark:text-slate-400">{h.registrationNumber}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 text-xs">
                          <div className="font-medium text-slate-900 dark:text-slate-200">{h.bloodBankContact?.name}</div>
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {h.bloodBankContact?.phone}
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {h.bloodBankContact?.email}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Accredited
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse">
                              <Clock className="h-3.5 w-3.5" /> Pending Audit
                            </span>
                          )}
                          {h.verificationStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                              <XCircle className="h-3.5 w-3.5" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isVerified ? (
                              <button
                                onClick={() => handleVerify(h.id, 'rejected')}
                                disabled={isUpdating}
                                className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-900 dark:hover:text-white transition disabled:opacity-50"
                              >
                                Revoke Approval
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerify(h.id, 'verified')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Approve Accreditation
                              </button>
                            )}
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

export default AdminHospitalsPage;

