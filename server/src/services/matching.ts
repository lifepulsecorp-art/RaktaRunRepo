import type { BloodComponent, BloodGroup, BloodRequest, Donor } from '../types.js';

export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'], 'O+': ['O-', 'O+'], 'A-': ['O-', 'A-'], 'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'], 'B+': ['O-', 'O+', 'B-', 'B+'], 'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export const COMPONENT_MIN_INTERVAL_DAYS: Record<BloodComponent, number> = {
  whole_blood: 90, RBC: 90, platelets: 14, plasma: 28,
};

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function scoreDonor(donor: Donor, distance: number, componentMatch: boolean): number {
  const days = donor.lastDonationDate ? Math.max(0, (Date.now() - Date.parse(donor.lastDonationDate)) / 86400000) : 365;
  const response = donor.heroStats.averageResponseTime || 1800;
  return Math.round(100 + Math.max(0, 40 - distance * 2) + Math.min(20, days / 5) + (response < 600 ? 20 : response < 1200 ? 10 : 0) + (donor.availabilityStatus === 'available' ? 10 : 0) + (componentMatch ? 10 : 0));
}

export function findCandidates(request: BloodRequest, donors: Donor[], excludedIds: Set<string> = new Set()) {
  const groups = BLOOD_COMPATIBILITY[request.bloodGroup];
  const minDays = COMPONENT_MIN_INTERVAL_DAYS[request.component];
  const now = Date.now();
  return donors.flatMap((donor) => {
    if (excludedIds.has(donor.id) || donor.eligibilityStatus !== 'eligible') return [];
    if (
      donor.availabilityStatus === 'unavailable' ||
      ((donor.availabilityStatus === 'emergency_only' || donor.notificationPreferences?.criticalOnly) && request.urgency !== 'critical')
    ) return [];
    if (!groups.includes(donor.bloodGroup) || !donor.bloodComponentEligibility.includes(request.component)) return [];
    const certificateExpiry = Date.parse(donor.verification?.expiryDate || '');
    if (!Number.isFinite(certificateExpiry) || certificateExpiry <= now) return [];
    if (donor.deferralUntil && Date.parse(donor.deferralUntil) > now) return [];
    const donorInterval = (request.component === 'whole_blood' || request.component === 'RBC')
      ? (donor.gender === 'female' ? 120 : donor.gender === 'male' ? 90 : donor.donationIntervalDays || 90)
      : minDays;
    if (donor.lastDonationDate && (now - Date.parse(donor.lastDonationDate)) / 86400000 < donorInterval) return [];
    const distance = distanceKm(request.hospitalLocation, donor.coordinates);
    if (!Number.isFinite(distance) || distance > Math.min(request.radiusKm, donor.preferredRadius || request.radiusKm)) return [];
    return [{ donor, distance: Math.round(distance * 10) / 10, score: scoreDonor(donor, distance, true) }];
  }).sort((a, b) => b.score - a.score || a.distance - b.distance);
}
