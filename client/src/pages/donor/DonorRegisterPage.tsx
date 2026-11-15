import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Upload,
  ArrowLeft,
  ShieldCheck,
  FileText,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const isCertificateImage = (file: File) => {
  const extension = file.name.toLowerCase().split('.').pop();
  const expectedMime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
    : extension === 'png' ? 'image/png'
      : extension === 'webp' ? 'image/webp'
        : null;
  return Boolean(expectedMime && (!file.type || file.type === expectedMime));
};

export const DonorRegisterPage: React.FC = () => {
  const { profile, roleData, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState(roleData?.fullName || profile?.name || '');
  const [phone, setPhone] = useState(roleData?.phone || '+91');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>(roleData?.bloodGroup || 'O+');
  const [gender, setGender] = useState<'male' | 'female' | ''>(roleData?.gender || '');
  const [components, setComponents] = useState<string[]>(roleData?.bloodComponentEligibility || ['whole_blood', 'RBC']);
  const [hemoglobinLevel, setHemoglobinLevel] = useState<number>(roleData?.hemoglobinLevel || 14.0);
  const [weight, setWeight] = useState<number>(roleData?.weight || 68);
  const [homeLocality, setHomeLocality] = useState(roleData?.homeLocality || 'Manipal, Udupi');
  const [preferredRadius, setPreferredRadius] = useState<number>(roleData?.preferredRadius || 15);

  // Certificate fields
  const [hospitalName, setHospitalName] = useState(roleData?.verification?.hospitalName || 'Kasturba Hospital, Manipal');
  const [certificateId, setCertificateId] = useState(roleData?.verification?.certificateId || `LP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [verifiedBy, setVerifiedBy] = useState(roleData?.verification?.verifiedBy || 'Dr. Screening Officer');
  const [certificateFileName, setCertificateFileName] = useState<string>(roleData?.verification?.certificateFileName || '');
  const [certificateFileBase64, setCertificateFileBase64] = useState<string>('');

  useEffect(() => {
    if (roleData) {
      if (roleData.fullName) setFullName(roleData.fullName);
      if (roleData.phone) setPhone(roleData.phone);
      if (roleData.bloodGroup) setBloodGroup(roleData.bloodGroup);
      if (roleData.gender) setGender(roleData.gender);
      if (roleData.bloodComponentEligibility?.length) setComponents(roleData.bloodComponentEligibility);
      if (roleData.hemoglobinLevel) setHemoglobinLevel(roleData.hemoglobinLevel);
      if (roleData.weight) setWeight(roleData.weight);
      if (roleData.homeLocality) setHomeLocality(roleData.homeLocality);
      if (roleData.preferredRadius) setPreferredRadius(roleData.preferredRadius);
      if (roleData.verification?.hospitalName) setHospitalName(roleData.verification.hospitalName);
      if (roleData.verification?.certificateId) setCertificateId(roleData.verification.certificateId);
      if (roleData.verification?.verifiedBy) setVerifiedBy(roleData.verification.verifiedBy);
      if (roleData.verification?.certificateFileName) setCertificateFileName(roleData.verification.certificateFileName);
    } else if (profile?.name) {
      setFullName(profile.name);
    }
  }, [roleData, profile]);

  const toggleComponent = (comp: string) => {
    if (components.includes(comp)) {
      setComponents(components.filter((c) => c !== comp));
    } else {
      setComponents([...components, comp]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isCertificateImage(file)) {
      e.target.value = '';
      setErrorMessage('Upload a certificate image in JPG, PNG, or WEBP format. PDF files are not accepted.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      e.target.value = '';
      setErrorMessage('Certificate images must be 3 MB or smaller.');
      return;
    }

    setErrorMessage(null);
    setCertificateFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setCertificateFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateFileBase64 && !roleData?.verification?.certificateFileName) {
      setErrorMessage('Please upload your hospital screening certificate as a JPG, PNG, or WEBP image.');
      return;
    }
    if (!gender) {
      setErrorMessage('Choose Male or Female to calculate your whole blood refresh interval.');
      return;
    }
    if (certificateFileBase64 && !/\.(jpe?g|png|webp)$/i.test(certificateFileName)) {
      setErrorMessage('Upload a certificate image in JPG, PNG, or WEBP format. PDF files are not accepted.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const rhType = bloodGroup.includes('-') ? 'negative' : 'positive';

    try {
      const payload = {
        fullName,
        phone,
        bloodGroup,
        gender,
        rhType,
        bloodComponentEligibility: components,
        hemoglobinLevel: Number(hemoglobinLevel),
        weight: Number(weight),
        homeLocality,
        preferredRadius: Number(preferredRadius),
        hospitalName,
        certificateId,
        verifiedBy,
        ...(certificateFileBase64 ? { certificateFileName, certificateFileBase64 } : {}),
      };
      await api.post('/donors', payload);
      await refreshProfile();
      navigate('/donor');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to complete donor onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Donor Medical Profile"
      subtitle="Hospital Screened Verification & Clinical Parameters"
      badge={<Badge variant="destructive">Screened Network</Badge>}
      withSidebar={true}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/donor')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Verification banner */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Hospital Screened Blood Network
              </h2>
              <p className="text-xs text-slate-600 dark:text-rose-200/80 mt-1 leading-relaxed">
                RaktaRun is an emergency dispatch network reserved for hospital-verified donors. Please upload the digital screening certificate
                issued during your clinical evaluation in Udupi or Dakshina Kannada.
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Donor Personal & Contact Details */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-rose-500" /> Donor Identity & Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Full Name (as on Aadhaar) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Shetty"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Home Locality (Base Area) *
                  </label>
                  <input
                    type="text"
                    required
                    value={homeLocality}
                    onChange={(e) => setHomeLocality(e.target.value)}
                    placeholder="e.g. Manipal, Kadri, Brahmavar, Surathkal"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Emergency Travel Radius (km) *
                  </label>
                  <input
                    type="number"
                    required
                    value={preferredRadius}
                    onChange={(e) => setPreferredRadius(parseInt(e.target.value))}
                    min={5}
                    max={50}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Medical Typing & Eligibility */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" /> Medical Typing & Health Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm font-bold text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:outline-none transition"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-) [Universal]</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Male or Female *
                  </label>
                  <select required value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition">
                    <option value="">Select</option>
                    <option value="male">Male · 90 days</option>
                    <option value="female">Female · 120 days</option>
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Sets your estimated whole blood refresh interval.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Hemoglobin Level (g/dL) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={hemoglobinLevel}
                    onChange={(e) => setHemoglobinLevel(parseFloat(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    min={45}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Screened Component Eligibility
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'whole_blood', label: 'Whole Blood' },
                    { id: 'RBC', label: 'Red Blood Cells (RBC)' },
                    { id: 'platelets', label: 'Platelets (Single Donor)' },
                    { id: 'plasma', label: 'Plasma (FFP)' },
                  ].map((comp) => {
                    const isSelected = components.includes(comp.id);
                    return (
                      <button
                        type="button"
                        key={comp.id}
                        onClick={() => toggleComponent(comp.id)}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold border transition ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {comp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Hospital Certificate Verification Upload */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-rose-500" /> Hospital Digital Screening Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Screening Hospital *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="Kasturba Hospital, Manipal"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Certificate Serial ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Verified By Doctor *
                  </label>
                  <input
                    type="text"
                    required
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    placeholder="Dr. Screening Officer"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Upload Digital Certificate Image (JPG / PNG / WEBP)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-rose-500/50 transition bg-slate-50/50 dark:bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-8 w-8 text-rose-500" />
                  {certificateFileName ? (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        Selected: {certificateFileName}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click or drag file here to attach certificate
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JPG, PNG, or WEBP images up to 3 MB. PDFs are not accepted.</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/donor')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="gap-2 px-6"
            >
              <CheckCircle2 className="h-4 w-4" /> Save & Update Profile
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default DonorRegisterPage;
