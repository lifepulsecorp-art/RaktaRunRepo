import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { RaktaRunLogo } from '../../components/RaktaRunLogo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import EmailOtpVerification from '../../components/EmailOtpVerification';
import { ArrowLeft, Building2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

const inputClass = 'w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-sm';

export default function HospitalRegisterPage() {
  const { role, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    registrationNumber: '',
    address: '',
    locality: '',
    pincode: '',
    contactName: '',
    contactPhone: '',
    bloodBankName: '',
    bloodBankPhone: '',
    latitude: 13.3524,
    longitude: 74.7927,
  });
  const navigate = useNavigate();

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const setPreset = (lat: number, lng: number, locality: string) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng, locality }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        role: 'hospital',
        displayName: form.name,
      });
      setOtpStep(true);
    } catch (err: any) {
      console.error('Hospital registration error:', err);
      const message = err.response?.data?.error || err.message || 'Registration failed';
      if (err.response?.status === 409 && message.toLowerCase().includes('verification is already pending')) {
        setOtpStep(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (token: string) => {
    localStorage.setItem('lifepulse_token', token);
    await api.post('/hospitals/register', {
      name: form.name,
      licenseNumber: form.registrationNumber,
      registrationNumber: form.registrationNumber,
      address: form.address,
      district: form.locality.toLowerCase().includes('mangal') ? 'Dakshina Kannada' : 'Udupi',
      coordinates: { latitude: form.latitude, longitude: form.longitude },
      bloodBankContact: { name: form.contactName, phone: form.contactPhone, email: form.email },
    });
    await refreshProfile();
    setDone(true);
    setTimeout(() => navigate('/hospital/pending'), 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-3 sm:p-6">
        <Card className="text-center max-w-md p-8 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Registration Submitted</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Awaiting administrator clinical verification… Redirecting to verification status screen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-3 transition-colors duration-200 sm:p-6">
      {/* Top Header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between">
          <RaktaRunLogo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to={role === 'hospital' ? '/hospital' : '/register'}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl py-4 sm:py-8">
        <Card className="p-4 shadow-xl sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hospital Authority Registration
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your medical center will be reviewed by a RaktaRun administrator before emergency broadcast permissions are activated.
              </p>
            </div>
            <Badge variant="success" className="hidden sm:inline-flex gap-1">
              <Building2 className="h-3 w-3" /> Healthcare Portal
            </Badge>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {otpStep ? (
            <EmailOtpVerification
              email={form.email.trim()}
              onVerified={completeRegistration}
              onBack={() => setOtpStep(false)}
            />
          ) : <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Official Email
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="hospital@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Password (min 8)
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Hospital Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Kasturba Hospital, Manipal"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Clinical License #
                </label>
                <input
                  required
                  value={form.registrationNumber}
                  onChange={(e) => update('registrationNumber', e.target.value)}
                  placeholder="REG-KA-2026-904"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                Physical Street Address
              </label>
              <input
                required
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Tiger Circle, Madhav Nagar"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Locality / City
                </label>
                <input
                  required
                  value={form.locality}
                  onChange={(e) => update('locality', e.target.value)}
                  placeholder="Manipal"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  PIN Code
                </label>
                <input
                  required
                  value={form.pincode}
                  onChange={(e) => update('pincode', e.target.value)}
                  placeholder="576104"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-2">
                Coordinates & Preset Location
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreset(13.3524, 74.7927, 'Manipal')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <MapPin className="h-3 w-3 text-rose-500" /> Manipal (13.3524, 74.7927)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(12.9141, 74.8560, 'Mangaluru')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <MapPin className="h-3 w-3 text-rose-500" /> Mangaluru (12.9141, 74.8560)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(13.3409, 74.7421, 'Udupi')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <MapPin className="h-3 w-3 text-rose-500" /> Udupi (13.3409, 74.7421)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Contact Person
                </label>
                <input
                  required
                  value={form.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  placeholder="Dr. Anand Kumar"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Official Phone
                </label>
                <input
                  required
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="+918202922761"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Blood Bank Incharge
                </label>
                <input
                  required
                  value={form.bloodBankName}
                  onChange={(e) => update('bloodBankName', e.target.value)}
                  placeholder="Dr. Ramesh Shenoy"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Blood Bank Hotline
                </label>
                <input
                  required
                  value={form.bloodBankPhone}
                  onChange={(e) => update('bloodBankPhone', e.target.value)}
                  placeholder="+918202922762"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-rose-600/25"
              >
                Register Hospital Authority
              </Button>
            </div>
          </form>}
        </Card>
      </div>

      <div className="mx-auto w-full max-w-3xl py-4 text-center text-xs text-slate-500">
        RaktaRun Emergency Medical Authority Verification Portal
      </div>
    </div>
  );
}
