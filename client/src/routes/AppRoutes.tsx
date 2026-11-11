import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import PublicDonorRegisterPage from '../pages/register/DonorRegisterPage';
import HospitalRegisterPage from '../pages/register/HospitalRegisterPage';
import DonorPendingPage from '../pages/donor/DonorPendingPage';
import HospitalPendingPage from '../pages/hospital/HospitalPendingPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminHospitalsPage from '../pages/admin/AdminHospitalsPage';
import AdminDonorsPage from '../pages/admin/AdminDonorsPage';
import AdminBuddyReportsPage from '../pages/admin/AdminBuddyReportsPage';
import HospitalDashboardPage from '../pages/HospitalDashboardPage';
import HospitalProfilePage from '../pages/hospital/HospitalProfilePage';
import DonorDashboardPage from '../pages/DonorDashboardPage';
import DonorMedicalProfilePage from '../pages/donor/DonorRegisterPage';
import LiveTrackingPage from '../pages/LiveTrackingPage';
import EmergencyRequestPage from '../pages/hospital/EmergencyRequestPage';
import HeroWallPage from '../pages/HeroWallPage';
import DonorHeroCardPage from '../pages/donor/DonorHeroCardPage';
import BuddyPage from '../pages/BuddyPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/donor" element={<PublicDonorRegisterPage />} />
      <Route path="/register/hospital" element={<HospitalRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/hero-wall" element={<HeroWallPage />} />
      <Route path="/heroes" element={<HeroWallPage />} />
      <Route path="/buddy/:token" element={<BuddyPage />} />

      {/* PENDING (logged in but not verified) */}
      <Route path="/donor/pending" element={<ProtectedRoute><DonorPendingPage /></ProtectedRoute>} />
      <Route path="/hospital/pending" element={<ProtectedRoute><HospitalPendingPage /></ProtectedRoute>} />

      {/* DONOR (verified) */}
      <Route path="/donor" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboardPage /></ProtectedRoute>} />
      <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboardPage /></ProtectedRoute>} />
      <Route path="/donor/register" element={<ProtectedRoute allowedRoles={['donor']}><DonorMedicalProfilePage /></ProtectedRoute>} />
      <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={['donor']}><DonorMedicalProfilePage /></ProtectedRoute>} />
      <Route path="/donor/hero-card" element={<ProtectedRoute allowedRoles={['donor']}><DonorHeroCardPage /></ProtectedRoute>} />
      <Route path="/donor/hero-studio" element={<ProtectedRoute allowedRoles={['donor']}><DonorHeroCardPage /></ProtectedRoute>} />

      {/* HOSPITAL (verified) */}
      <Route path="/hospital" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalDashboardPage /></ProtectedRoute>} />
      <Route path="/hospital/profile" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalProfilePage /></ProtectedRoute>} />
      <Route path="/hospital/request/new" element={<ProtectedRoute allowedRoles={['hospital']}><EmergencyRequestPage /></ProtectedRoute>} />

      {/* ADMIN */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/hospitals" element={<ProtectedRoute allowedRoles={['admin']}><AdminHospitalsPage /></ProtectedRoute>} />
      <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDonorsPage /></ProtectedRoute>} />
      <Route path="/admin/buddy-reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminBuddyReportsPage /></ProtectedRoute>} />

      {/* SHARED */}
      <Route path="/live-tracking/:requestId" element={<ProtectedRoute><LiveTrackingPage /></ProtectedRoute>} />

      {/* FALLBACK */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
