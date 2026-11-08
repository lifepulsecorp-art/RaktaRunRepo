import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  Clock,
  Save,
  ShieldCheck,
  Phone,
  FileText,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const HospitalProfilePage: React.FC = () => {
  const { roleData, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [hospitalId, setHospitalId] = useState<string>('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState<'Udupi' | 'Dakshina Kannada'>('Udupi');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(13.3535);
  const [longitude, setLongitude] = useState<number>(74.7865);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'rejected'>('pending');

  useEffect(() => {
    // Populate with existing hospital profile if present
    if (roleData) {
      setHospitalId(roleData.id || '');
      setName(roleData.name || '');
      setDistrict(roleData.district || 'Udupi');
      setAddress(roleData.address || '');
      setLatitude(roleData.coordinates?.latitude || 13.3535);
      setLongitude(roleData.coordinates?.longitude || 74.7865);
      setContactName(roleData.bloodBankContact?.name || '');
      setContactPhone(roleData.bloodBankContact?.phone || '');
      setContactEmail(roleData.bloodBankContact?.email || '');
      setLicenseNumber(roleData.licenseNumber || '');
      setRegistrationNumber(roleData.registrationNumber || '');
      setVerificationStatus(roleData.verificationStatus || 'pending');
    }
  }, [roleData]);

  const handlePresetLocation = (city: string) => {
    if (city === 'manipal') {
      setLatitude(13.3535);
      setLongitude(74.7865);
      setDistrict('Udupi');
    } else if (city === 'mangaluru') {
      setLatitude(12.8703);
      setLongitude(74.8806);
      setDistrict('Dakshina Kannada');
    } else if (city === 'udupi') {
      setLatitude(13.3409);
      setLongitude(74.7421);
      setDistrict('Udupi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      name,
      district,
      address,
      coordinates: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      bloodBankContact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
      },
      licenseNumber,
      registrationNumber,
    };

    try {
      if (hospitalId) {
        // Update existing hospital
        await api.put(`/hospitals/${hospitalId}`, payload);
        setSuccessMessage('Hospital profile and blood bank credentials saved successfully.');
      } else {
        // Create new hospital profile
        const res = await api.post('/hospitals', payload);
        setHospitalId(res.data.id);
        // Sync user role record
        await api.post('/auth/sync', { hospitalId: res.data.id, role: 'hospital' });
        setSuccessMessage('Hospital registered! Pending verification by RaktaRun Admin.');
      }
      await refreshProfile();
    } catch (err: any) {
      console.error('Error saving hospital profile:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save hospital profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Hospital Medical Profile"
      subtitle="RaktaRun Medical Authority • Block G Facility & Blood Bank Accreditation"
      badge={
        <Badge variant={verificationStatus === 'verified' ? 'success' : 'warning'} className="uppercase">
          {verificationStatus}
        </Badge>
      }
      withSidebar={true}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/hospital')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Accreditation Status Banner */}
        <div>
          {verificationStatus === 'verified' ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 backdrop-blur-md flex items-start gap-4">
              <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Accredited Emergency Medical Center</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-1">
                  This facility is officially authorized by RaktaRun Medical Authority. You have permission to dispatch
                  instant blood emergency alerts to verified donors in Udupi & Dakshina Kannada.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5 backdrop-blur-md flex items-start gap-4">
              <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">Verification In Progress</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                  Your blood bank accreditation is pending review by the RaktaRun District Admin. Please ensure all licensing
                  and emergency contact information below is complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {hospitalId && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">Connected Hospital ID</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{hospitalId}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              This account stays linked to this hospital. Blood bank details saved below update this hospital&apos;s record automatically.
            </p>
          </div>
        )}

        {/* Profile Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Facility Information */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-500" /> Facility & Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kasturba Hospital, Manipal"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition"
                  >
                    <option value="Udupi">Udupi District</option>
                    <option value="Dakshina Kannada">Dakshina Kannada District</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Coordinate Presets
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetLocation('manipal')}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 transition"
                    >
                      Manipal
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetLocation('mangaluru')}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 transition"
                    >
                      Mangaluru
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetLocation('udupi')}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500 transition"
                    >
                      Udupi City
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Physical Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Tiger Circle, Madhav Nagar, Manipal, Karnataka 576104"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    GPS Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    GPS Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Blood Bank Accreditation & Licensing */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-rose-500" /> Accreditation & Licensing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Blood Bank License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. KA-BB-UDP-042"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Hospital Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. REG-KH-1953"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Blood Bank Contact Person */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-rose-500" /> Blood Bank Emergency Officer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Officer / Doctor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Anand Kumar"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+918202922761"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Official Blood Bank Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="bloodbank@manipal.edu"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/hospital')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="gap-2 px-6"
            >
              <Save className="h-4 w-4" /> Save Hospital Profile
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default HospitalProfilePage;
