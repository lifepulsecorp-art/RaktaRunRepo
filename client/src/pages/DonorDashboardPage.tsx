import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  ShieldCheck,
  Heart,
  BellRing,
  UserCheck,
  Sliders,
  Bell,
  Clock,
  Compass,
  Camera,
  Sparkles,
  History,
  Calendar,
  X,
  MapPin,
  Navigation,
  Edit3,
  CheckCircle2,
  Send,
  Mail,
  Users,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LocationPickerModal from '../components/LocationPickerModal';
import { AppLayout } from '../components/AppLayout';

const BADGE_MAP: Record<string, { label: string; icon: string }> = {
  life_pulse_hero: { label: 'RaktaRun Hero', icon: '✦' },
  rapid_responder: { label: 'Rapid Responder', icon: '›' },
  repeat_hero: { label: 'Repeat Hero', icon: '◆' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '◇' },
  community_champion: { label: 'Community Champion', icon: '✧' },
};

export function getCompatibilityExplanation(donorBlood?: string, reqBlood?: string): string {
  if (!donorBlood || !reqBlood) return 'Clinically verified compatible donor match';
  if (donorBlood === 'O-') return `Universal life-saving match: your O- is compatible with this ${reqBlood} request.`;
  if (donorBlood === reqBlood) return `Exact group match: your verified ${donorBlood} directly matches this patient's blood group.`;
  return `Compatible blood match: your ${donorBlood} is clinically compatible with recipient ${reqBlood}.`;
}

export const DonorDashboardPage: React.FC = () => {
  const { profile, roleData, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [dismissedModalIds, setDismissedModalIds] = useState<Set<string>>(new Set());
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [buddyInviteByMatch, setBuddyInviteByMatch] = useState<Record<string, string>>({});
  const [buddyBusyId, setBuddyBusyId] = useState('');
  const [buddyMessage, setBuddyMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [consent, setConsent] = useState(Boolean(roleData?.publicHeroConsent));
  const [consentNotice, setConsentNotice] = useState('');

  // Location picker modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  // History states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{ summary?: any; history: any[] }>({ history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'donations' | 'alerts'>('all');

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/donors/me/history');
      setHistoryData(res.data);
    } catch (e) {
      console.error('Failed to load donor history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal]);
  
  // Donor preference states
  const [preferredRadius, setPreferredRadius] = useState<number>(roleData?.preferredRadius || 15);
  const [savingRadius, setSavingRadius] = useState(false);
  const [radiusNotice, setRadiusNotice] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({
    push: roleData?.notificationPreferences?.push ?? true,
    sms: roleData?.notificationPreferences?.sms ?? true,
    email: roleData?.notificationPreferences?.email ?? true,
    criticalOnly: roleData?.notificationPreferences?.criticalOnly ?? false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefNotice, setPrefNotice] = useState('');

  const [browserPushPermission, setBrowserPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [testingNotif, setTestingNotif] = useState(false);
  const [testNotifResult, setTestNotifResult] = useState<any>(null);

  const handleTogglePush = async (checked: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, push: checked }));
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          setBrowserPushPermission(permission);
          if (permission === 'granted') {
            new Notification('RaktaRun Web Push Enabled', {
              body: 'You are now ready to receive real-time emergency blood requests on this device.',
              icon: '/favicon.svg',
            });
          }
        } catch {
          // ignore permission errors
        }
      } else {
        setBrowserPushPermission(Notification.permission);
      }
    }
  };

  const handleTestNotifications = async () => {
    setTestingNotif(true);
    setTestNotifResult(null);
    try {
      const res = await api.post('/donors/me/test-notifications');
      setTestNotifResult(res.data);

      if (notifPrefs.push && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('RaktaRun Test Emergency Alert', {
          body: `Emergency dispatch test for ${roleData?.fullName || 'Donor'}. Priority: CODE RED Trauma.`,
          icon: '/favicon.svg',
        });
      }
    } catch (err: any) {
      setTestNotifResult({
        error: err.response?.data?.error || err.message || 'Failed to dispatch test notification',
      });
    } finally {
      setTestingNotif(false);
    }
  };

  // Sync preferred radius and notification preferences whenever roleData updates
  useEffect(() => {
    if (roleData?.preferredRadius != null) {
      setPreferredRadius(Number(roleData.preferredRadius));
    }
    if (roleData?.notificationPreferences) {
      setNotifPrefs({
        push: roleData.notificationPreferences.push ?? true,
        sms: roleData.notificationPreferences.sms ?? true,
        email: roleData.notificationPreferences.email ?? true,
        criticalOnly: roleData.notificationPreferences.criticalOnly ?? false,
      });
    }
  }, [roleData?.preferredRadius, roleData?.notificationPreferences]);

  const handleUpdateRadius = async (newRadius: number) => {
    const validRadius = Math.max(5, Math.min(50, Number(newRadius) || 15));
    setPreferredRadius(validRadius);
    setSavingRadius(true);
    setRadiusNotice('');
    try {
      await api.put('/donors/me/preferences', {
        preferredRadius: validRadius,
        notificationPreferences: notifPrefs,
      });
      await refreshProfile();
      setRadiusNotice(`✓ Travel radius saved (${validRadius} km)`);
      setTimeout(() => setRadiusNotice(''), 3500);
    } catch {
      setRadiusNotice('Failed to save radius.');
      setTimeout(() => setRadiusNotice(''), 3500);
    } finally {
      setSavingRadius(false);
    }
  };

  // Emergency status controls
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | 'emergency_only'>(
    roleData?.availabilityStatus || 'available'
  );
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const updateEmergencyStatus = async (newStatus: 'available' | 'unavailable' | 'emergency_only') => {
    setStatusUpdating(true);
    setStatusNotice('');
    try {
      await api.put('/donors/me/availability', { availabilityStatus: newStatus });
      setAvailabilityStatus(newStatus);
      setStatusNotice(`Emergency status updated to: ${newStatus === 'emergency_only' ? 'Critical Trauma Only' : newStatus}`);
      setTimeout(() => setStatusNotice(''), 3500);
    } catch {
      setStatusNotice('Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const refreshAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/donors/me/alerts');
      setAllAlerts(Array.isArray(data) ? data : []);
    } catch {
      /* Keep last alert snapshot while reconnecting */
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    const poll = setInterval(refreshAlerts, 4000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [refreshAlerts]);

  const pendingAlerts = allAlerts.filter(
    (entry: any) =>
      entry.match?.status === 'alerted' &&
      Date.parse(entry.match.alertExpiresAt || entry.match.alertedAt || '') > now
  );

  const activeMissions = allAlerts.filter(
    (entry: any) => ['accepted', 'en_route', 'reached'].includes(entry.match?.status)
  );

  const respond = async (matchId: string, response: 'accepted' | 'declined', shareLocation: boolean = true) => {
    setBusyId(matchId);
    try {
      let initialCoords: { latitude: number; longitude: number } | null = null;
      if (response === 'accepted' && shareLocation && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            });
          });
          initialCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        } catch (geoErr) {
          console.warn('Initial GPS query skipped or denied on accept:', geoErr);
        }
      }

      await api.post(`/donors/matches/${matchId}/respond`, { response });

      if (response === 'accepted' && initialCoords) {
        try {
          await api.post(`/donors/matches/${matchId}/location`, initialCoords);
        } catch (locErr) {
          console.warn('Initial live location post deferred:', locErr);
        }
      }

      if (response === 'accepted') {
        const targetReq = allAlerts.find((item) => item.match.id === matchId)?.request;
        navigate(`/live-tracking/${targetReq?.id || ''}`);
      } else {
        await refreshAlerts();
      }
    } catch (error: any) {
      window.alert(error.response?.data?.error || 'Could not respond to alert.');
      await refreshAlerts();
    } finally {
      setBusyId('');
    }
  };

  const createBuddyInvite = async (matchId: string) => {
    setBuddyBusyId(matchId);
    setBuddyMessage('');
    try {
      const { data } = await api.post(`/buddies/matches/${matchId}/link`);
      const inviteUrl = `${window.location.origin}/buddy/${data.token}`;
      setBuddyInviteByMatch((current) => ({ ...current, [matchId]: inviteUrl }));
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setBuddyMessage('Your unique buddy link is ready and copied. Send it to a friend.');
      } catch {
        setBuddyMessage('Your unique buddy link is ready. Copy it below and send it to a friend.');
      }
    } catch (error: any) {
      setBuddyMessage(error.response?.data?.error || 'Could not create a buddy link for this alert.');
    } finally {
      setBuddyBusyId('');
    }
  };

  const copyBuddyInvite = async (matchId: string) => {
    const inviteUrl = buddyInviteByMatch[matchId];
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setBuddyMessage('Buddy link copied.');
    } catch {
      setBuddyMessage('Select and copy the buddy link.');
    }
  };

  const setPublicConsent = async (enabled: boolean) => {
    setConsent(enabled);
    setConsentNotice('');
    try {
      await api.put('/donors/me/public-hero-consent', { enabled });
      setConsentNotice(enabled ? '✓ Featured on Public Hero Wall!' : 'Profile hidden from Public Wall.');
      setTimeout(() => setConsentNotice(''), 3000);
    } catch {
      setConsent(!enabled);
      setConsentNotice('Failed to update hero wall status.');
      setTimeout(() => setConsentNotice(''), 3000);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    setPrefNotice('');
    try {
      await api.put('/donors/me/preferences', {
        preferredRadius,
        notificationPreferences: notifPrefs,
      });
      await refreshProfile();
      setPrefNotice('Preferences updated successfully!');
      setTimeout(() => setPrefNotice(''), 3000);
    } catch (e: any) {
      setPrefNotice('Failed to update preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <AppLayout
      title="Emergency Readiness & Hero Status"
      subtitle="Active volunteer responder across the Udupi & Dakshina Kannada trauma emergency network."
      actions={
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Network Status: <strong className="text-slate-900 dark:text-white">Live Connected</strong></span>
        </div>
      }
    >
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Active Donation Missions (En Route / In Transit) */}
        {activeMissions.length > 0 && (
          <div className="mt-6 space-y-4">
            {activeMissions.map(({ match, request }: any) => (
              <div
                key={match.id}
                className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-emerald-950/30 animate-in fade-in"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <Navigation className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                          Active Donation Mission
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          Live GPS Streaming Active
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        En Route to {request?.hospitalName || 'Hospital'}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Patient requires <strong>{request?.bloodGroup} {request?.component?.replace('_', ' ')}</strong> · Mission Status: <strong className="capitalize text-emerald-300">{match.status.replace('_', ' ')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/live-tracking/${request?.id}`}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98]"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Open Live GPS Navigation & Route →</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incoming Emergency Requests Banner on Dashboard */}
        {pendingAlerts.length > 0 && (
          <div className="mt-6 space-y-4">
            {pendingAlerts.map(({ match, request }: any) => {
              const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000));
              const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));
              const compText = getCompatibilityExplanation(roleData?.bloodGroup, request?.bloodGroup);

              return (
                <div
                  key={match.id}
                  className="rounded-3xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-rose-950/50 animate-in fade-in"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-black text-rose-300 uppercase tracking-widest">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                          Emergency Hospital Dispatch
                        </span>
                        <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-mono font-bold text-amber-300">
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                          <span>Expires in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white">
                          {request?.hospitalName} urgently requires {request?.bloodGroup} {request?.component?.replace('_', ' ')}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-emerald-400">
                          {compText}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Located approx. <strong>{match.distance} km</strong> away (Est. drive time: <strong className="text-rose-300">{etaMinutes} mins</strong>) · Urgency: <strong className="capitalize text-rose-400">{request?.urgency || 'Critical'}</strong>
                        </p>
                      </div>

                      {/* Location Sharing Checkbox */}
                      <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={shareLocationEnabled}
                          onChange={(e) => setShareLocationEnabled(e.target.checked)}
                          className="accent-emerald-500 h-4 w-4 rounded"
                        />
                        <span className="flex items-center gap-1.5">
                          <Navigation className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <strong>Share real-time GPS location</strong> with hospital team upon acceptance
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                      <button
                        disabled={!seconds || !!busyId}
                        onClick={() => respond(match.id, 'accepted', shareLocationEnabled)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-950/20 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98] disabled:opacity-50"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>
                          {busyId === match.id
                            ? 'Connecting…'
                            : shareLocationEnabled
                            ? 'Accept Donation & Share Location'
                            : 'Accept Donation'}
                        </span>
                      </button>
                      <button
                        disabled={!!busyId}
                        onClick={() => respond(match.id, 'declined')}
                        className="w-full sm:w-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-5 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3 Status Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="font-bold text-slate-900 dark:text-white">Hospital Certificate</h3>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Certificate ID</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{roleData?.verification?.certificateId || 'Awaiting verification'}</p>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Verified by: <strong className="text-slate-900 dark:text-white">{roleData?.verification?.hospitalName || '—'}</strong></p>
              <p className="text-xs text-slate-500 mt-1">Medical Officer: {roleData?.verification?.verifiedBy || '—'}</p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <Link
                to="/donor/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 transition"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Update Screening Certificate →</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-amber-500 dark:text-amber-400">
                <Award className="h-6 w-6" />
                <h3 className="font-bold text-slate-900 dark:text-white">Hero Badges & Score</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(roleData?.heroStats?.badges || []).map((b: string) => {
                  const info = BADGE_MAP[b] || { label: b.replace(/_/g, ' '), icon: '✦' };
                  return (
                    <span key={b} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span>{info.icon}</span> {info.label}
                    </span>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                Completed donations: <strong className="text-slate-900 dark:text-white">{roleData?.heroStats?.totalDonations || 0}</strong> · Emergency responses: <strong className="text-slate-900 dark:text-white">{roleData?.heroStats?.totalEmergencyResponses || 0}</strong>
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white transition shadow-sm active:scale-[0.98]"
              >
                <History className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                <span>View Donation History ({roleData?.heroStats?.totalDonations || 0}) →</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <BellRing className="h-6 w-6" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Emergency Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${
                    availabilityStatus === 'available' ? 'bg-emerald-500 animate-ping' :
                    availabilityStatus === 'emergency_only' ? 'bg-amber-500 animate-ping' :
                    'bg-slate-400 dark:bg-slate-500'
                  }`} />
                  <span className={`text-xs font-bold uppercase ${
                    availabilityStatus === 'available' ? 'text-emerald-600 dark:text-emerald-400' :
                    availabilityStatus === 'emergency_only' ? 'text-amber-600 dark:text-amber-400' :
                    'text-slate-500 dark:text-slate-400'
                  }`}>
                    {availabilityStatus === 'emergency_only' ? 'Trauma Only' : availabilityStatus}
                  </span>
                </div>
              </div>

              {/* Status Selector Pills */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('available')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'available'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  ✓ Ready
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('emergency_only')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'emergency_only'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  ◆ Trauma
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => updateEmergencyStatus('unavailable')}
                  className={`py-2 rounded-lg transition text-center ${
                    availabilityStatus === 'unavailable'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  ‖ Pause
                </button>
              </div>

              {statusNotice && (
                <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{statusNotice}</p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              Locality: <strong className="text-slate-900 dark:text-white">{roleData?.homeLocality || 'Manipal / Mangaluru'}</strong> • Radius: <strong className="text-slate-900 dark:text-white">{preferredRadius} km</strong>
            </p>
          </div>
        </div>

        {/* Preferences & Radius Control Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Preferred Radius Slider */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <Compass className="h-5 w-5" />
                <h3 className="font-bold text-slate-900 dark:text-white">Preferred Travel Radius</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Only receive emergency broadcasts from hospitals within this distance from your locality.
              </p>

              {/* Default Registered Location Display */}
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" /> Default Registered Location
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Verified Base Station
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white transition active:scale-[0.98]"
                      title="Click and drag pin on interactive map to update your emergency base location"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit on Map</span>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {roleData?.homeLocality || 'Manipal (671326)'}
                  </p>
                  {roleData?.coordinates && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      Base Coordinates: {roleData.coordinates.latitude?.toFixed(4)}° N, {roleData.coordinates.longitude?.toFixed(4)}° E
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Maximum Distance</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-base font-bold">{preferredRadius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={preferredRadius}
                  onChange={(e) => setPreferredRadius(Number(e.target.value))}
                  className="mt-3 w-full accent-rose-600 cursor-pointer"
                />
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>5 km (Local)</span>
                  <span>15 km (Default)</span>
                  <span>25 km (Regional)</span>
                  <span>50 km (District-wide)</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[5, 10, 15, 25, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleUpdateRadius(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      preferredRadius === r
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {radiusNotice ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">{radiusNotice}</span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">Auto-filters hospital alerts within {preferredRadius} km</span>
              )}
              <button
                type="button"
                onClick={() => handleUpdateRadius(preferredRadius)}
                disabled={savingRadius}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition disabled:opacity-50 active:scale-[0.98]"
              >
                {savingRadius ? 'Saving…' : 'Save Travel Radius'}
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
                  <Sliders className="h-5 w-5" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Alert & Channel Preferences</h3>
                </div>
                <button
                  type="button"
                  onClick={handleTestNotifications}
                  disabled={testingNotif}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white transition active:scale-[0.98] disabled:opacity-50"
                  title="Dispatch simulated test alerts across your enabled channels"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{testingNotif ? 'Dispatching…' : 'Test Channels'}</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Choose how and when RaktaRun coordinates emergency requests with you.
              </p>

              <div className="mt-4 space-y-3">
                {/* Web Push */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-semibold">
                      <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Web Push Notifications
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.push}
                      onChange={(e) => handleTogglePush(e.target.checked)}
                      className="accent-rose-600 h-4 w-4 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Instant desktop & browser alert banners</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      !notifPrefs.push ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                      browserPushPermission === 'granted' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                      browserPushPermission === 'denied' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {!notifPrefs.push ? 'Disabled' :
                       browserPushPermission === 'granted' ? '● Browser Permitted' :
                       browserPushPermission === 'denied' ? '! Blocked by Browser' :
                       '● Permission Pending'}
                    </span>
                  </div>
                </div>

                {/* Email Emergency Dispatch */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-semibold">
                      <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Email Emergency Dispatch
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.email}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, email: e.target.checked })}
                      className="accent-rose-600 h-4 w-4 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Clinical requisition details sent to {roleData?.email || profile?.email || 'registered email'}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      notifPrefs.email ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {notifPrefs.email ? '● Brevo Transactional SMTP' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Critical Trauma Only */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-semibold">
                      <Heart className="h-4 w-4 text-rose-600" /> Critical Trauma Only (Code Red)
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.criticalOnly}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, criticalOnly: e.target.checked })}
                      className="accent-rose-600 h-4 w-4 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pl-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Filter out standard inventory requests; wake only for life-or-death emergencies</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      notifPrefs.criticalOnly ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {notifPrefs.criticalOnly ? 'Code Red Only' : 'All Urgencies'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Results Banner */}
              {testNotifResult && (
                <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 p-3 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-sky-800 dark:text-sky-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Test Dispatches Completed
                    </span>
                    <button
                      type="button"
                      onClick={() => setTestNotifResult(null)}
                      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Dispatched to {testNotifResult.recipientPhone || roleData?.phone || 'Phone'}
                    {testNotifResult.recipientEmail ? ` & ${testNotifResult.recipientEmail}` : ''}:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(testNotifResult.results || []).map((r: any, idx: number) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          r.success
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {r.channel.toUpperCase()}: {r.provider} {r.success ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {prefNotice ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">{prefNotice}</span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">Settings sync across mobile & web</span>
              )}
              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="rounded-xl border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 px-4 py-2 text-xs font-semibold disabled:opacity-50 transition active:scale-[0.98] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
              >
                {savingPrefs ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* Public Hero Wall Opt-in */}
        <section className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
              <Award className="h-5 w-5" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Community Hero Recognition & Shareables</h3>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Celebrate your life-saving donations publicly on the RaktaRun Community Wall. Displays only your first name, blood group, and verified district. Contact numbers and home coordinates remain strictly confidential.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/donor/hero-card"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Camera className="h-4 w-4 transition-transform group-hover:rotate-6" />
                <span>Preview & Download My Hero Cards →</span>
              </Link>
              <Link
                to="/hero-wall"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 px-4 py-2.5 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-750"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                <span>Visit Community Hero Wall →</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-4 py-3.5 shadow-inner">
              <div className="text-left md:text-right">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">Show My Hero Profile</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {consent ? 'Public on Wall' : 'Hidden from Wall'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consent}
                onClick={() => setPublicConsent(!consent)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                  consent ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle public recognition on hero wall"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    consent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {consentNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {consentNotice}
              </span>
            )}
          </div>
        </section>
      </div>

      {/* High-Impact Emergency Alert Modal */}
      {pendingAlerts.filter((item) => !dismissedModalIds.has(item.match.id)).length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/90 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-rose-500/40 bg-white p-4 text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:text-white dark:shadow-rose-950/60 sm:p-7">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white font-bold animate-pulse shadow-lg shadow-rose-600/40">
                  <BellRing className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                    RAKTARUN EMERGENCY ALERT
                  </p>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Someone near you needs your blood.</h2>
                </div>
              </div>

              {/* Minimize/Dismiss Button to review dashboard */}
              <button
                onClick={() => {
                  const ids = new Set(dismissedModalIds);
                  pendingAlerts.forEach((a) => ids.add(a.match.id));
                  setDismissedModalIds(ids);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                title="Minimize alert to dashboard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pendingAlerts.filter((item) => !dismissedModalIds.has(item.match.id)).map(({ match, request }) => {
              const seconds = Math.max(0, Math.ceil((Date.parse(match.alertExpiresAt || match.alertedAt) - now) / 1000));
              const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));
              const compText = getCompatibilityExplanation(roleData?.bloodGroup, request?.bloodGroup);

              return (
                <article key={match.id} className="mt-5 space-y-4">
                  {/* Blood Group & Need Overview */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-500">{request?.bloodGroup}</span>
                        <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 capitalize">
                          {request?.component?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({request?.unitsRequired || 1} units)</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Building2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="font-semibold">{request?.hospitalName}</span>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-2.5 text-xs text-emerald-700 dark:bg-slate-900 dark:border-slate-800/80 dark:text-emerald-400 font-medium">
                        {compText}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Approximately <strong>{match.distance} km</strong> away (within your preferred {preferredRadius} km radius)</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Urgency: <strong className="capitalize">{request?.urgency || 'Critical emergency'}</strong></span>
                      </div>
                    </div>

                    {/* Motivational Callout & Prominent Travel Time */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs italic text-slate-600 dark:text-slate-300">
                        “You could be the person who gets there in time.”
                      </p>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 px-3.5 py-2">
                        <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Estimated travel time:</span>
                        <span className="text-sm font-bold text-rose-800 dark:text-rose-200 font-mono">{etaMinutes} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Location Sharing Option */}
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs cursor-pointer hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={shareLocationEnabled}
                      onChange={(e) => setShareLocationEnabled(e.target.checked)}
                      className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Share Live GPS Location with Hospital
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Allows hospital trauma staff to monitor your driving transit and prepare emergency triage beds.
                      </span>
                    </div>
                  </label>

                  {/* Actions */}
                  <div className="grid gap-3 pt-2 sm:grid-cols-[1.7fr_1fr_1fr]">
                    <button
                      disabled={!seconds || !!busyId}
                      onClick={() => respond(match.id, 'accepted', shareLocationEnabled)}
                      className="flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-3.5 font-bold text-white shadow-xl shadow-emerald-950/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-sm sm:text-base active:scale-[0.98]"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>
                        {busyId === match.id
                          ? 'Connecting…'
                          : shareLocationEnabled
                          ? 'Accept Donation & Share Location'
                          : 'Accept Donation'}
                      </span>
                    </button>
                    <button
                      disabled={!!busyId}
                      onClick={() => respond(match.id, 'declined')}
                      className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-200 text-xs sm:text-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={buddyBusyId === match.id}
                      onClick={() => createBuddyInvite(match.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                    >
                      <Users className="h-4 w-4" />
                      {buddyBusyId === match.id ? 'Creating link…' : 'Invite a buddy'}
                    </button>
                  </div>
                  {buddyInviteByMatch[match.id] && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                      <p className="text-xs leading-5 text-slate-700 dark:text-slate-200">A friend can share their name and phone without creating an account. Hospital staff must verify eligibility and screening before donation.</p>
                      <div className="mt-2 flex gap-2">
                        <input aria-label="Buddy invite link" readOnly value={buddyInviteByMatch[match.id]} className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs dark:border-amber-800 dark:bg-slate-900" />
                        <button type="button" onClick={() => copyBuddyInvite(match.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700">
                          {buddyMessage === 'Buddy link copied.' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  {buddyMessage && <p role="status" className="text-xs text-slate-600 dark:text-slate-300">{buddyMessage}</p>}
                </article>
              );
            })}

            <p className="mt-4 text-center text-xs text-slate-500">
              Live location streaming is protected and only active during this emergency transit.
            </p>
          </div>
        </div>
      )}

      {/* Donor Contribution & History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-5 right-5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              title="Close history modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                <History className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-1">
                  Verified Contribution Log
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Donation & Emergency Response History</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete record of your hospital screenings, emergency alert dispatches, and life-saving donations.
                </p>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Donations</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{historyData.summary?.totalDonations ?? roleData?.heroStats?.totalDonations ?? 0}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Verified hospital transfusions</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                  <BellRing className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dispatches Answered</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{historyData.summary?.totalEmergencyResponses ?? roleData?.heroStats?.totalEmergencyResponses ?? 0}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-300 font-medium mt-1">Coastal Karnataka trauma alerts</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Screening Center</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{historyData.summary?.hospitalName || roleData?.verification?.hospitalName || 'Kasturba Hospital, Manipal'}</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">{historyData.summary?.certificateId || roleData?.verification?.certificateId || 'Screened Network'}</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-6 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'all' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  All Entries ({historyData.history.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('donations')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'donations' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Completed Donations ({historyData.history.filter((h: any) => h.matchStatus === 'donated').length})
                </button>
                <button
                  onClick={() => setHistoryFilter('alerts')}
                  className={`rounded-lg px-3 py-1.5 transition ${historyFilter === 'alerts' ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Emergency Responses ({historyData.history.filter((h: any) => h.response === 'accepted' || h.type?.includes('Emergency')).length})
                </button>
              </div>

              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                Blood Group: {roleData?.bloodGroup}
              </span>
            </div>

            {/* History List */}
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              {loadingHistory && (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading verified contribution history…</div>
              )}

              {!loadingHistory && historyData.history.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  No previous donations or responses logged yet. When you answer hospital alerts and donate, your verified history will be displayed here.
                </div>
              )}

              {!loadingHistory && historyData.history
                .filter((item: any) => {
                  if (historyFilter === 'donations') return item.matchStatus === 'donated';
                  if (historyFilter === 'alerts') return item.response === 'accepted' || item.type?.includes('Emergency');
                  return true;
                })
                .map((item: any, idx: number) => {
                  const dateStr = item.donationCompletedAt || item.alertedAt;
                  const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Date';

                  return (
                    <article
                      key={item.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-slate-300 transition dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                            item.matchStatus === 'donated' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.matchStatus === 'donated' ? <Award className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.hospitalName}</h4>
                              <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                {item.bloodGroup} · {item.component?.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{dateFormatted}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span>{item.type || 'Verified Blood Donation'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800/80">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.matchStatus === 'donated' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                          }`}>
                            {item.matchStatus === 'donated' ? '✓ Donation Fulfilled' : 'Alert Answered'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Verified by: {item.verifiedBy || 'Dr. Medical Officer'}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                RaktaRun Emergency Health Network • Coastal Karnataka
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-semibold px-4 py-2 transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Location Picker Modal (Click & Drag Map) */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialCoordinates={roleData?.coordinates}
        initialLocality={roleData?.homeLocality}
        onSaved={async () => {
          await refreshProfile();
          setRadiusNotice('✓ Default location and coordinates updated!');
          setTimeout(() => setRadiusNotice(''), 3500);
        }}
      />
    </AppLayout>
  );
};

export default DonorDashboardPage;
