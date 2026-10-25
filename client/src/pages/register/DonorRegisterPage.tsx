import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { RaktaRunLogo } from '../../components/RaktaRunLogo';
import EmailOtpVerification from '../../components/EmailOtpVerification';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { getEmailValidationMessage } from '../../utils/emailValidation';
import { COUNTRY_CALLING_CODES } from '../../utils/countryCallingCodes';
import {
  Building2,
  Phone,
  MapPin,
  X,
  FileQuestion,
  ShieldCheck,
  Info,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEFAULT_HOSPITALS = [
  {
    id: 'hosp_manipal_01',
    name: 'Kasturba Hospital, Manipal',
    address: 'Tiger Circle, Madhav Nagar, Manipal, Karnataka 576104',
    district: 'Udupi',
    phone: '+918202922761',
    contactPerson: 'Dr. Anand Kumar (Blood Bank Officer)',
    timing: '24/7 Transfusion Medicine & Screening Desk',
  },
  {
    id: 'hosp_aj_02',
    name: 'AJ Hospital & Research Centre',
    address: 'Kuntikana, Mangaluru, Karnataka 575004',
    district: 'Dakshina Kannada',
    phone: '+918242225533',
    contactPerson: 'Dr. Pradeep Nayak (Blood Bank Department)',
    timing: '24/7 Blood Bank & Donor Health Station',
  },
  {
    id: 'hosp_udupi_dist_03',
    name: 'District Government Hospital, Udupi',
    address: 'Court Road, Udupi, Karnataka 576101',
    district: 'Udupi',
    phone: '+918202520555',
    contactPerson: 'Blood Bank Officer',
    timing: '8:00 AM - 6:00 PM (Emergency 24/7)',
  },
  {
    id: 'hosp_father_muller_04',
    name: 'Father Muller Medical College Hospital',
    address: 'Father Muller Road, Kankanady, Mangaluru, Karnataka 575002',
    district: 'Dakshina Kannada',
    phone: '+918242238000',
    contactPerson: 'Transfusion Unit Incharge',
    timing: '24/7 Transfusion Medicine Services',
  },
];

const inputClass = 'w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-sm';

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const isCertificateImage = (file: File) => {
  const extension = file.name.toLowerCase().split('.').pop();
  const expectedMime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
    : extension === 'png' ? 'image/png'
      : extension === 'webp' ? 'image/webp'
        : null;
  return Boolean(expectedMime && (!file.type || file.type === expectedMime));
};

export default function DonorRegisterPage() {
  const { role, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitalList, setHospitalList] = useState(DEFAULT_HOSPITALS);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    bloodGroup: 'O+',
    homeLocality: '',
    pincode: '',
    lastDonationDate: '',
    certificate: null as File | null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/hospitals')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            address: h.address || 'Karnataka',
            district: h.district || 'Udupi',
            phone: h.bloodBankContact?.phone || h.phone || '+918202922761',
            contactPerson: h.bloodBankContact?.name || 'Blood Bank Officer',
            timing: 'Authorized RaktaRun Screening Station',
          }));
          setHospitalList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });
  const selectedCallingCode = COUNTRY_CALLING_CODES.find((country) => country.region === phoneCountry)?.callingCode || '91';
  const maxNationalNumberLength = 15 - selectedCallingCode.length;

  const handleCertificateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && !isCertificateImage(file)) {
      event.target.value = '';
      update('certificate', null);
      setError('Upload a certificate image in JPG, PNG, or WEBP format. PDF files are not accepted.');
      return;
    }
    if (file && file.size > 3 * 1024 * 1024) {
      event.target.value = '';
      update('certificate', null);
      setError('Certificate images must be 3 MB or smaller.');
      return;
    }
    setError('');
    update('certificate', file);
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

    const cleanFullName = form.fullName.trim();
    const cleanPhone = form.phone.trim();
    const cleanBloodGroup = form.bloodGroup.trim();

    if (!cleanFullName || !cleanPhone || !cleanBloodGroup) {
      setError('Please provide your full name, phone number, and blood group.');
      return;
    }

    if (!form.certificate) {
      setError('Please select and upload your hospital screening certificate image.');
      return;
    }
    if (!isCertificateImage(form.certificate)) {
      setError('Upload a certificate image in JPG, PNG, or WEBP format. PDF files are not accepted.');
      return;
    }
    if (form.certificate.size > 3 * 1024 * 1024) {
      setError('Certificate images must be 3 MB or smaller.');
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/register', {
        email: form.email.trim(),
        password: form.password,
        role: 'donor',
        displayName: cleanFullName,
      });
      setStep(2);
    } catch (err: any) {
      console.error('Donor registration error:', err);
      const message = err.response?.data?.error || err.message || 'Registration failed';
      if (err.response?.status === 409 && message.toLowerCase().includes('verification is already pending')) {
        setStep(2);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (token: string) => {
    localStorage.setItem('lifepulse_token', token);
    const certificateFileBase64 = form.certificate ? await readFileAsBase64(form.certificate) : '';
    await api.post('/donors/register', {
      fullName: form.fullName.trim(),
      phone: `+${selectedCallingCode}${form.phone.trim()}`,
      bloodGroup: form.bloodGroup.trim(),
      homeLocality: form.homeLocality.trim(),
      pincode: form.pincode.trim(),
      lastDonationDate: form.lastDonationDate || null,
      certificateFileName: form.certificate?.name || 'certificate.jpg',
      certificateFileBase64,
    });
    await refreshProfile();
    setStep(3);
    setTimeout(() => navigate('/donor/pending'), 2000);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-3 sm:p-6">
        <Card className="text-center max-w-md p-8 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Registration Submitted</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Redirecting to your pending verification screen…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col p-3 transition-colors duration-200 sm:p-6 ${step === 2 ? 'h-[100dvh] overflow-y-hidden' : 'min-h-screen justify-between'}`}>
      {/* Top Header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between">
          <RaktaRunLogo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to={role === 'donor' ? '/donor' : '/register'}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
          </div>
        </div>
      </div>

      <div className={`mx-auto w-full max-w-3xl py-4 sm:py-8 ${step === 2 ? 'flex min-h-0 flex-1 items-center' : ''}`}>
        <Card className={step === 2 ? 'border-0 bg-transparent p-0 shadow-none dark:border-0 dark:bg-transparent dark:shadow-none' : 'p-4 shadow-xl sm:p-8'}>
          <div className={`flex flex-col justify-between border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center ${step === 2 ? 'mb-3 gap-2 pb-3' : 'mb-6 gap-3 pb-6'}`}>
            <div className="min-w-0">
              <h1 className={`font-bold tracking-tight text-slate-900 dark:text-white ${step === 2 ? 'text-lg leading-tight sm:text-xl' : 'text-2xl'}`}>
                Donor Registration
              </h1>
              <p className={`mt-1 text-slate-600 dark:text-slate-400 ${step === 2 ? 'text-[11px] leading-4 sm:text-xs' : 'text-xs sm:text-sm'}`}>
                You must possess an authorized hospital-issued medical certificate to register.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHospitalModal(true)}
              className={`self-start flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 sm:self-auto ${step === 2 ? 'px-2.5 py-1.5 text-[10px]' : 'px-3.5 py-2 text-xs'}`}
            >
              <FileQuestion className="h-4 w-4 shrink-0 text-rose-500" />
              <span>Don't have a certificate?</span>
            </button>
          </div>

          {step !== 2 && error && (
            <div ref={errorRef} role="alert" className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {step === 2 ? (
            <EmailOtpVerification
              email={form.email.trim()}
              onVerified={completeRegistration}
              onBack={() => setStep(1)}
            />
          ) : <form
            onSubmit={handleSubmit}
            onInvalidCapture={(event) => {
              event.preventDefault();
              const field = event.target as HTMLInputElement;
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
                      ? `must contain 4 to ${maxNationalNumberLength} digits.`
                      : 'is invalid.';
              setError(`${label}: ${reason}`);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Rahul Shetty"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Phone Number
                </label>
                <div className="flex min-w-0 gap-2">
                  <select
                    aria-label="Country calling code"
                    autoComplete="tel-country-code"
                    value={phoneCountry}
                    onChange={(e) => setPhoneCountry(e.target.value)}
                    className="w-[43%] min-w-0 rounded-xl border border-slate-300 bg-white px-2.5 py-2.5 text-xs text-slate-900 shadow-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:text-sm"
                  >
                    {COUNTRY_CALLING_CODES.map((country) => (
                      <option key={country.region} value={country.region}>
                        {country.name} (+{country.callingCode})
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern={`[0-9]{4,${maxNationalNumberLength}}`}
                    maxLength={maxNationalNumberLength}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, maxNationalNumberLength))}
                    placeholder="Phone number"
                    className={`${inputClass} min-w-0 flex-1`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'donor-email-error' : undefined}
                  value={form.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    update('email', value);
                    if (emailError) setEmailError(getEmailValidationMessage(value));
                  }}
                  onBlur={(e) => setEmailError(getEmailValidationMessage(e.currentTarget.value))}
                  onInvalid={(e) => setEmailError(getEmailValidationMessage(e.currentTarget.value))}
                  placeholder="donor@example.com"
                  className={inputClass}
                />
                {emailError && <p id="donor-email-error" role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{emailError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Password (min 8)
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
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Blood Group
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => update('bloodGroup', e.target.value)}
                  className={inputClass}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                  Home Locality
                </label>
                <input
                  required
                  value={form.homeLocality}
                  onChange={(e) => update('homeLocality', e.target.value)}
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
                  type="text"
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

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block mb-1.5">
                Last Donation Date (optional)
              </label>
              <input
                type="date"
                value={form.lastDonationDate}
                onChange={(e) => update('lastDonationDate', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-rose-500" />
                  Hospital Medical Certificate Image (JPG/PNG/WEBP)
                </label>
                <button
                  type="button"
                  onClick={() => setShowHospitalModal(true)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Building2 className="h-3.5 w-3.5" /> Don't have a certificate?
                </button>
              </div>
              <input
                required
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={handleCertificateChange}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white file:mr-3 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:bg-rose-600 file:text-white file:text-xs file:font-semibold hover:file:bg-rose-500 cursor-pointer shadow-sm"
              />
              <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                An AI-assisted document check may analyze the uploaded certificate. It cannot confirm hospital records or approve alert access; a RaktaRun admin must review your application.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Max size 3MB • Image formats: JPG, PNG, WEBP</span>
                <button
                  type="button"
                  onClick={() => setShowHospitalModal(true)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                >
                  Find partner hospitals →
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-rose-600/25"
              >
                Register as Verified Donor
              </Button>
            </div>
          </form>}
        </Card>
      </div>

      {/* Modal: Don't Have a Certificate */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="relative w-full max-w-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              type="button"
              onClick={() => setShowHospitalModal(false)}
              className="absolute top-5 right-5 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="warning" className="mb-1">
                  Medical Screening Requirement
                </Badge>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">How to Get Your Donor Medical Certificate</h2>
              </div>
            </div>

            {/* Instructional Note */}
            <div className="mt-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-sm">
                <Info className="h-4 w-4" /> Note for prospective donors:
              </p>
              <p>
                RaktaRun is a medically screened network. To protect patient lives and ensure you are safe to donate, you must obtain a quick, authorized health screening before registering.
              </p>
              <div className="space-y-1.5 pl-2 pt-1 border-t border-amber-200 dark:border-amber-500/20">
                <p>1. <strong>Visit any authorized hospital</strong> from the list below in Udupi or Mangaluru.</p>
                <p>2. Ask the Blood Bank or Transfusion Medicine Department for a <strong>Free Donor Health Screening & Medical Certificate</strong> (takes ~10–15 mins for vitals, hemoglobin & blood grouping).</p>
                <p>3. <strong>Collect your certificate</strong> (digital copy or photo of the paper screening certificate).</p>
                <p className="text-rose-600 dark:text-rose-400 font-bold">4. Come back to this portal, upload your certificate, and complete your registration to start saving lives!</p>
              </div>
            </div>

            {/* List of Available Hospitals */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Authorized Partner Hospitals & Blood Banks ({hospitalList.length})
                </h3>
                <span className="text-[11px] text-slate-500">Udupi & Dakshina Kannada</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {hospitalList.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 hover:border-rose-400 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{hosp.name}</h4>
                          <span className="rounded-md bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            {hosp.district}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{hosp.address}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Contact: <span className="text-slate-700 dark:text-slate-300 font-medium">{hosp.contactPerson}</span> · {hosp.timing}
                        </p>
                      </div>

                      <a
                        href={`tel:${hosp.phone}`}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                        title="Call hospital blood bank"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 order-2 sm:order-1"
              >
                ← Return to RaktaRun Home
              </Link>
              <Button
                type="button"
                onClick={() => setShowHospitalModal(false)}
                className="w-full sm:w-auto text-xs font-bold order-1 sm:order-2"
              >
                Got it, I'll visit a hospital and come back
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl py-4 text-center text-xs text-slate-500">
        RaktaRun Emergency Medical Network • Udupi & Dakshina Kannada
      </div>
    </div>
  );
}
