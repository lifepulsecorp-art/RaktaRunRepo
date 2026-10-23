import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { writeJson } from './db.js';
import type { User, Hospital, Donor, BloodRequest, Match } from '../types.js';

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@raktarun.in';
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  throw new Error('Set ADMIN_PASSWORD in the server environment before seeding the database.');
}
if (adminPassword.length < 12 || Buffer.byteLength(adminPassword, 'utf8') > 72) {
  throw new Error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 bytes.');
}
const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

// 1. Users (including Admin with provided UID)
const users: User[] = [
  {
    uid: '5G6ajWegMiepIzvIyreG7bx82SG2',
    email: adminEmail,
    role: 'admin',
    name: 'RaktaRun System Admin',
    passwordHash: adminPasswordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'hospital_manipal_uid',
    email: 'manipal@lifepulse.in',
    role: 'hospital',
    name: 'Kasturba Hospital Manipal Staff',
    hospitalId: 'hosp_manipal_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'hospital_aj_uid',
    email: 'ajhospital@lifepulse.in',
    role: 'hospital',
    name: 'AJ Hospital Mangaluru Staff',
    hospitalId: 'hosp_aj_02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'donor_rahul_uid',
    email: 'rahul.shetty@gmail.com',
    role: 'donor',
    name: 'Rahul Shetty',
    phone: '+919876543210',
    donorId: 'donor_rahul_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'donor_sneha_uid',
    email: 'sneha.rao@gmail.com',
    role: 'donor',
    name: 'Sneha Rao',
    phone: '+919876543211',
    donorId: 'donor_sneha_02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 2. Hospitals
const hospitals: Hospital[] = [
  {
    id: 'hosp_manipal_01',
    uid: 'hospital_manipal_uid',
    name: 'Kasturba Hospital, Manipal',
    address: 'Tiger Circle, Madhav Nagar, Manipal, Karnataka 576104',
    district: 'Udupi',
    coordinates: {
      latitude: 13.3535,
      longitude: 74.7865,
    },
    verificationStatus: 'verified',
    bloodBankContact: {
      name: 'Dr. Anand Kumar',
      phone: '+918202922761',
      email: 'bloodbank.khm@manipal.edu',
    },
    licenseNumber: 'KA-BB-UDP-042',
    registrationNumber: 'REG-KH-1953',
    verifiedBy: '5G6ajWegMiepIzvIyreG7bx82SG2',
    verifiedAt: '2026-01-10T10:00:00.000Z',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'hosp_aj_02',
    uid: 'hospital_aj_uid',
    name: 'AJ Hospital & Research Centre',
    address: 'Kuntikana, Mangaluru, Karnataka 575004',
    district: 'Dakshina Kannada',
    coordinates: {
      latitude: 12.8988,
      longitude: 74.8562,
    },
    verificationStatus: 'verified',
    bloodBankContact: {
      name: 'Dr. Pradeep Nayak',
      phone: '+918242225533',
      email: 'bloodbank@ajhospital.in',
    },
    licenseNumber: 'KA-BB-MNG-088',
    registrationNumber: 'REG-AJ-2001',
    verifiedBy: '5G6ajWegMiepIzvIyreG7bx82SG2',
    verifiedAt: '2026-01-15T11:30:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T11:30:00.000Z',
  },
  {
    id: 'hosp_udupi_dist_03',
    name: 'District Government Hospital, Udupi',
    address: 'Court Road, Udupi, Karnataka 576101',
    district: 'Udupi',
    coordinates: {
      latitude: 13.3409,
      longitude: 74.7421,
    },
    verificationStatus: 'verified',
    bloodBankContact: {
      name: 'Dr. Vasudeva K',
      phone: '+918202520555',
      email: 'dh.udupi@karnataka.gov.in',
    },
    licenseNumber: 'KA-BB-UDP-007',
    registrationNumber: 'REG-DH-1970',
    verifiedBy: '5G6ajWegMiepIzvIyreG7bx82SG2',
    verifiedAt: '2026-02-01T09:00:00.000Z',
    createdAt: '2026-02-01T08:30:00.000Z',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
];

// 3. Medically Verified Donors
const donors: Donor[] = [
  {
    id: 'donor_rahul_01',
    uid: 'donor_rahul_uid',
    fullName: 'Rahul Shetty',
    phone: '+919876543210',
    aadhaarVerified: true,
    bloodGroup: 'O+',
    rhType: 'positive',
    bloodComponentEligibility: ['whole_blood', 'RBC', 'plasma'],
    lastDonationDate: '2026-06-15T00:00:00.000Z',
    hemoglobinLevel: 14.5,
    weight: 74,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: 'hosp_manipal_01',
      hospitalName: 'Kasturba Hospital, Manipal',
      certificateId: 'LP-CERT-2025-00841',
      verifiedAt: '2026-08-15T00:00:00.000Z',
      verifiedBy: 'Dr. Anand Kumar',
      expiryDate: '2027-08-15T00:00:00.000Z',
    },
    homeLocality: 'Manipal, Udupi',
    coordinates: {
      latitude: 13.3525,
      longitude: 74.792,
    },
    locationSharingEnabled: false,
    preferredRadius: 15,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 4,
      totalDonations: 6,
      averageResponseTime: 380,
      badges: ['life_pulse_hero', 'rapid_responder', 'repeat_hero'],
      lastResponseDate: '2026-09-12T14:20:00.000Z',
    },
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-09-12T14:20:00.000Z',
  },
  {
    id: 'donor_sneha_02',
    uid: 'donor_sneha_uid',
    fullName: 'Sneha Rao',
    phone: '+919876543211',
    aadhaarVerified: true,
    bloodGroup: 'A+',
    rhType: 'positive',
    bloodComponentEligibility: ['whole_blood', 'platelets'],
    lastDonationDate: '2026-07-20T00:00:00.000Z',
    hemoglobinLevel: 13.2,
    weight: 58,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: 'hosp_aj_02',
      hospitalName: 'AJ Hospital & Research Centre',
      certificateId: 'LP-CERT-2025-00842',
      verifiedAt: '2026-09-01T00:00:00.000Z',
      verifiedBy: 'Dr. Pradeep Nayak',
      expiryDate: '2027-09-01T00:00:00.000Z',
    },
    homeLocality: 'Kadri, Mangaluru',
    coordinates: {
      latitude: 12.8752,
      longitude: 74.855,
    },
    locationSharingEnabled: false,
    preferredRadius: 20,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 2,
      totalDonations: 3,
      averageResponseTime: 490,
      badges: ['life_pulse_hero'],
      lastResponseDate: '2026-08-30T10:15:00.000Z',
    },
    createdAt: '2026-02-14T00:00:00.000Z',
    updatedAt: '2026-08-30T10:15:00.000Z',
  },
  {
    id: 'donor_karthik_03',
    uid: 'donor_karthik_uid',
    fullName: 'Karthik Poojary',
    phone: '+919876543212',
    aadhaarVerified: true,
    bloodGroup: 'B+',
    rhType: 'positive',
    bloodComponentEligibility: ['whole_blood', 'RBC', 'plasma'],
    lastDonationDate: '2026-05-10T00:00:00.000Z',
    hemoglobinLevel: 15.0,
    weight: 78,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: 'hosp_udupi_dist_03',
      hospitalName: 'District Government Hospital, Udupi',
      certificateId: 'LP-CERT-2025-00843',
      verifiedAt: '2026-05-10T00:00:00.000Z',
      verifiedBy: 'Dr. Vasudeva K',
      expiryDate: '2027-05-10T00:00:00.000Z',
    },
    homeLocality: 'Brahmavar, Udupi',
    coordinates: {
      latitude: 13.421,
      longitude: 74.749,
    },
    locationSharingEnabled: false,
    preferredRadius: 25,
    availabilityStatus: 'emergency_only',
    heroStats: {
      totalEmergencyResponses: 5,
      totalDonations: 7,
      averageResponseTime: 340,
      badges: ['life_pulse_hero', 'rapid_responder', 'community_champion'],
      lastResponseDate: '2026-09-02T18:40:00.000Z',
    },
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-09-02T18:40:00.000Z',
  },
  {
    id: 'donor_ananya_04',
    uid: 'donor_ananya_uid',
    fullName: 'Ananya Bhat',
    phone: '+919876543213',
    aadhaarVerified: true,
    bloodGroup: 'AB-',
    rhType: 'negative',
    bloodComponentEligibility: ['whole_blood', 'platelets'],
    lastDonationDate: '2026-08-01T00:00:00.000Z',
    hemoglobinLevel: 12.8,
    weight: 54,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: 'hosp_manipal_01',
      hospitalName: 'Kasturba Hospital, Manipal',
      certificateId: 'LP-CERT-2025-00844',
      verifiedAt: '2026-08-01T00:00:00.000Z',
      verifiedBy: 'Dr. Anand Kumar',
      expiryDate: '2027-08-01T00:00:00.000Z',
    },
    homeLocality: 'Udupi City',
    coordinates: {
      latitude: 13.341,
      longitude: 74.745,
    },
    locationSharingEnabled: false,
    preferredRadius: 15,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 3,
      totalDonations: 4,
      averageResponseTime: 410,
      badges: ['life_pulse_hero', 'rare_blood_hero'],
      lastResponseDate: '2026-09-20T08:10:00.000Z',
    },
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-20T08:10:00.000Z',
  },
  {
    id: 'donor_mohammed_05',
    uid: 'donor_mohammed_uid',
    fullName: 'Mohammed Farooq',
    phone: '+919876543214',
    aadhaarVerified: true,
    bloodGroup: 'O-',
    rhType: 'negative',
    bloodComponentEligibility: ['whole_blood', 'RBC'],
    lastDonationDate: '2026-04-10T00:00:00.000Z',
    hemoglobinLevel: 14.1,
    weight: 71,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: 'hosp_aj_02',
      hospitalName: 'AJ Hospital & Research Centre',
      certificateId: 'LP-CERT-2025-00845',
      verifiedAt: '2026-04-10T00:00:00.000Z',
      verifiedBy: 'Dr. Pradeep Nayak',
      expiryDate: '2027-04-10T00:00:00.000Z',
    },
    homeLocality: 'Surathkal, Mangaluru',
    coordinates: {
      latitude: 13.008,
      longitude: 74.796,
    },
    locationSharingEnabled: false,
    preferredRadius: 20,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 6,
      totalDonations: 8,
      averageResponseTime: 310,
      badges: ['life_pulse_hero', 'rapid_responder', 'rare_blood_hero', 'community_champion'],
      lastResponseDate: '2026-09-28T16:00:00.000Z',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-28T16:00:00.000Z',
  },
];

// 4. Sample Blood Requests
const bloodRequests: BloodRequest[] = [
  {
    id: 'req_emergency_001',
    hospitalId: 'hosp_manipal_01',
    hospitalName: 'Kasturba Hospital, Manipal',
    hospitalLocation: {
      latitude: 13.3535,
      longitude: 74.7865,
    },
    patientInfo: {
      name: 'Ramesh Hegde',
      age: 42,
      gender: 'Male',
      ward: 'ICU Trauma Bed 4',
      doctor: 'Dr. Sudhir Rao',
    },
    bloodGroup: 'O+',
    component: 'whole_blood',
    unitsRequired: 2,
    urgency: 'critical',
    requiredBy: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    radiusKm: 20,
    status: 'searching',
    createdBy: 'hospital_manipal_uid',
    contactPerson: {
      name: 'Dr. Anand Kumar',
      phone: '+918202922761',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 5. Matches for Sample Request
const matches: Match[] = [
  {
    id: 'match_001_rahul',
    requestId: 'req_emergency_001',
    donorId: 'donor_rahul_01',
    distance: 0.6,
    score: 138,
    rank: 1,
    status: 'accepted',
    alertedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    respondedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    response: 'accepted',
    donorCurrentLocation: {
      latitude: 13.353,
      longitude: 74.789,
    },
    etaSeconds: 420,
    distanceRemaining: 650,
    reachedAt: null,
    donationCompletedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

console.log('Seeding RaktaRun Supabase database...');
(await writeJson('users', users));
(await writeJson('hospitals', hospitals));
(await writeJson('donors', donors));
(await writeJson('bloodRequests', bloodRequests));
(await writeJson('matches', matches));
console.log('Seed completed successfully:');
console.log(`   - Users: ${users.length} (Admin UID: 5G6ajWegMiepIzvIyreG7bx82SG2)`);
console.log(`   - Hospitals: ${hospitals.length}`);
console.log(`   - Donors: ${donors.length}`);
console.log(`   - Blood Requests: ${bloodRequests.length}`);
console.log(`   - Matches: ${matches.length}`);

