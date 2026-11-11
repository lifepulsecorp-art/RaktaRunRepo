export type UserRole = 'admin' | 'hospital' | 'donor';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  emailVerified?: boolean;
  passwordHash?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
  passwordResetRequestedAt?: string;
  phone?: string;
  hospitalId?: string;
  donorId?: string;
  createdAt: string;
  updatedAt: string;
  trustStatus?: 'clear' | 'under_review' | 'flagged';
}

export interface EmailVerificationChallenge {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  codeHash: string;
  expiresAt: string;
  resendAvailableAt: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuddyLink {
  id: string;
  token: string;
  requestId: string;
  matchId: string;
  donorId: string;
  referrerUid: string;
  createdAt: string;
  expiresAt: string;
}

export type BuddyConcernCategory = 'certificate_unavailable' | 'identity_not_verified' | 'not_available' | 'screening_concern' | 'other';

export interface BuddyHospitalReport {
  id: string;
  hospitalId: string;
  actorUid: string;
  category: BuddyConcernCategory;
  notes?: string;
  reportedAt: string;
}

export interface BuddyAdminReview {
  decision: 'dismissed' | 'confirmed';
  notes?: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface BuddyReferral {
  id: string;
  linkId: string;
  requestId: string;
  matchId: string;
  donorId: string;
  referrerUid: string;
  friendName: string;
  friendPhone: string;
  status: 'interest_received' | 'reported';
  createdAt: string;
  hospitalReport?: BuddyHospitalReport;
  adminReview?: BuddyAdminReview;
}

export interface BlockedEmail {
  email: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  deletedUid: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodComponent = 'whole_blood' | 'RBC' | 'platelets' | 'plasma';

export interface DonorVerification {
  hospitalId: string;
  hospitalName: string;
  certificateId: string;
  verifiedAt: string;
  verifiedBy: string;
  digitalSignature?: string;
  certificateFileName?: string;
  expiryDate: string;
  aiReview?: CertificateAiReview;
}

export interface CertificateAiReview {
  status: 'passed' | 'failed' | 'unavailable';
  summary: string;
  confidence: number;
  checkedAt: string;
  model?: string;
}

export interface HeroStats {
  totalEmergencyResponses: number;
  totalDonations: number;
  averageResponseTime: number; // in seconds
  badges: string[];
  lastResponseDate?: string | null;
}

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  whatsapp?: boolean;
  email?: boolean;
  criticalOnly: boolean;
}

export interface SystemConfig {
  alertTimeoutSeconds: number; // e.g. 120
  radiusStepKm: number; // e.g. 5
  maxRadiusKm: number; // e.g. 50
  schedulerIntervalSeconds: number; // e.g. 30
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Donor {
  id: string;
  uid: string;
  fullName: string;
  phone: string;
  email?: string;
  aadhaarVerified: boolean;
  bloodGroup: BloodGroup;
  rhType: 'positive' | 'negative';
  bloodComponentEligibility: BloodComponent[];
  lastDonationDate: string | null;
  hemoglobinLevel: number;
  weight: number;
  eligibilityStatus: 'pending' | 'eligible' | 'temporary_deferral' | 'permanent_deferral';
  deferralUntil?: string | null;
  deferralReason?: string | null;
  verification: DonorVerification;
  homeLocality: string;
  homeGeohash?: string;
  coordinates: Coordinates;
  locationSharingEnabled: boolean;
  preciseLocation?: Coordinates | null;
  preferredRadius: number; // in km
  availabilityStatus: 'available' | 'unavailable' | 'emergency_only';
  notificationPreferences?: NotificationPreferences;
  publicHeroConsent?: boolean;
  heroStats: HeroStats;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  uid?: string;
  name: string;
  address: string;
  district: 'Udupi' | 'Dakshina Kannada';
  coordinates: Coordinates;
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
  createdAt: string;
  updatedAt: string;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalLocation: Coordinates;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    ward?: string;
    doctor?: string;
  };
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequired: number;
  urgency: 'critical' | 'urgent' | 'standard';
  requiredBy: string;
  radiusKm: number;
  status: 'searching' | 'matched' | 'fulfilled' | 'cancelled' | 'expired' | 'unfulfilled';
  escalationLevel?: number;
  lastEscalatedAt?: string | null;
  createdBy: string;
  contactPerson: {
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  requestId: string;
  donorId: string;
  distance: number;
  score: number;
  rank: number;
  status: 'pending_alert' | 'alerted' | 'accepted' | 'declined' | 'expired' | 'en_route' | 'reached' | 'donated' | 'cancelled';
  alertedAt: string | null;
  respondedAt: string | null;
  response: 'accepted' | 'declined' | null;
  donorCurrentLocation?: Coordinates | null;
  etaSeconds?: number | null;
  distanceRemaining?: number | null;
  reachedAt?: string | null;
  donationCompletedAt?: string | null;
  alertExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

