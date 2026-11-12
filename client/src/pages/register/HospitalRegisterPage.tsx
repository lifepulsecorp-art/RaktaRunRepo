import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { RaktaRunLogo } from '../../components/RaktaRunLogo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PasswordInput } from '../../components/ui/PasswordInput';
import EmailOtpVerification from '../../components/EmailOtpVerification';
import { ArrowLeft, Building2, CheckCircle2, AlertCircle, Droplet } from 'lucide-react';
import { getEmailValidationMessage } from '../../utils/emailValidation';
import { getPasswordPolicyError, PASSWORD_POLICY_MESSAGE } from '../../utils/passwordPolicy';
import { PIN_CODE_ERROR_MESSAGE } from '../../utils/pinCode';

const inputClass = 'w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-sm';

type FacilityType = 'hospital' | 'blood-bank';

const locationPresets = {
  Manipal: { latitude: 13.3524, longitude: 74.7927 },
  Mangaluru: { latitude: 12.9141, longitude: 74.856 },
  Udupi: { latitude: 13.3409, longitude: 74.7421 },
} as const;

export default function HospitalRegisterPage() {
  const { role, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [facilityType, setFacilityType] = useState<FacilityType>('hospital');
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
    latitude: 13.3524,
    longitude: 74.7927,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const setLocality = (locality: keyof typeof locationPresets) => {
    setForm((f) => ({ ...f, ...locationPresets[locality], locality }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailValidationError = getEmailValidationMessage(form.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    setEmailError('');
    const passwordError = getPasswordPolicyError(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/register', {
        email: form.email.trim(),
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
      facilityType,
      licenseNumber: form.registrationNumber,
      registrationNumber: form.registrationNumber,
      address: form.address,
      locality: form.locality,
      pincode: form.pincode,
      location: { latitude: form.latitude, longitude: form.longitude },
      contactPerson: { name: form.contactName, phone: form.contactPhone },
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
    <div className={`min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col p-3 transition-colors duration-200 sm:p-6 ${otpStep ? 'h-[100dvh] overflow-y-hidden' : 'min-h-screen justify-between'}`}>
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

      <div className={`mx-auto w-full max-w-3xl py-4 sm:py-8 ${otpStep ? 'flex min-h-0 flex-1 items-center' : ''}`}>
        <Card className={otpStep ? 'border-0 bg-transparent p-0 shadow-none dark:border-0 dark:bg-transparent dark:shadow-none' : 'p-4 shadow-xl sm:p-8'}>
          <div className={`flex min-w-0 flex-col items-start sm:flex-row sm:items-start sm:justify-between ${otpStep ? 'mb-3 gap-1.5' : 'mb-5 gap-2 sm:mb-6'}`}>
            <div className="min-w-0">
              <h1 className={`break-words font-bold leading-tight tracking-tight text-slate-900 dark:text-white ${otpStep ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
                {facilityType === 'hospital' ? 'Hospital Authority Registration' : 'Blood Bank Authority Registration'}
              </h1>
              <p className={`mt-1 text-slate-600 dark:text-slate-400 ${otpStep ? 'text-[11px] leading-4 sm:text-xs' : 'text-xs sm:text-sm'}`}>
                Your medical center will be reviewed by a RaktaRun administrator before emergency broadcast permissions are activated.
              </p>
            </div>
            <Badge variant="success" className="inline-flex max-w-full shrink-0 gap-1 whitespace-nowrap">
              {facilityType === 'hospital' ? <Building2 className="h-3 w-3" /> : <Droplet className="h-3 w-3" />} Healthcare Portal
            </Badge>
          </div>

          {!otpStep && error && (
            <div ref={errorRef} role="alert" className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-200">
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
          ) : <form
            onSubmit={handleSubmit}
            onInvalidCapture={(event) => {
              event.preventDefault();
              const field = event.target as HTMLInputElement;
              if (field.name === 'pincode') {
                setError(PIN_CODE_ERROR_MESSAGE);
                return;
              }
              const label = field.labels?.[0]?.textContent?.trim()
                || field.parentElement?.querySelector('label')?.textContent?.trim()
                || field.parentElement?.parentElement?.querySelector('label')?.textContent?.trim()
                || 'This field';
              const reason = field.type === 'email'
                ? getEmailValidationMessage(field.value) || 'has an invalid format.'
                : field.validity.valueMissing
                  ? 'is required.'
                  : field.validity.typeMismatch
                    ? 'has an invalid format.'
                    : field.validity.patternMismatch
                      ? 'does not match the required format.'
                      : 'is invalid.';
              setError(`${label}: ${reason}`);
            }}
            className="space-y-4"
          >
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Register authority for
              </legend>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-950/60">
                {([
                  { value: 'hospital', label: 'Hospital', Icon: Building2 },
                  { value: 'blood-bank', label: 'Blood Bank', Icon: Droplet },
                ] as const).map(({ value, label, Icon }) => {
                  const selected = facilityType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFacilityType(value)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${selected ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'}`}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Official Email
                </label>
                <input
                  required
                  type="email"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'hospital-email-error' : undefined}
                  value={form.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    update('email', value);
                    if (emailError) setEmailError(getEmailValidationMessage(value));
                  }}
                  onBlur={(e) => setEmailError(getEmailValidationMessage(e.currentTarget.value))}
                  onInvalid={(e) => setEmailError(getEmailValidationMessage(e.currentTarget.value))}
                  placeholder="hospital@example.com"
                  className={inputClass}
                />
                {emailError && <p id="hospital-email-error" role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{emailError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Password
                </label>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{PASSWORD_POLICY_MESSAGE}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  {facilityType === 'hospital' ? 'Hospital Name' : 'Blood Bank Name'}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder={facilityType === 'hospital' ? 'Kasturba Hospital, Manipal' : 'District Blood Bank, Udupi'}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  {facilityType === 'hospital' ? 'Hospital Registration / License ID' : 'Blood Bank License / ID'}
                </label>
                <input
                  required
                  value={form.registrationNumber}
                  onChange={(e) => update('registrationNumber', e.target.value)}
                  placeholder={facilityType === 'hospital' ? 'Hospital license or registration ID' : 'Blood bank license or registration ID'}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                Street Address
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
                <select
                  required
                  value={form.locality}
                  onChange={(e) => setLocality(e.target.value as keyof typeof locationPresets)}
                  className={inputClass}
                >
                  <option value="" disabled>Select city</option>
                  {Object.keys(locationPresets).map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  PIN Code
                </label>
                <input
                  required
                  type="text"
                  name="pincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="576104"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Authority Contact
                </label>
                <input
                  required
                  value={form.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  placeholder="Contact person name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Contact Phone
                </label>
                <input
                  required
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 82029 22761"
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
                {facilityType === 'hospital' ? 'Register Hospital Authority' : 'Register Blood Bank Authority'}
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
