import type { BloodComponent, BloodRequest, Coordinates, Donor, Match } from '../types.js';
import { distanceKm } from './matching.js';

export function resolveDonorResponse(match: Match, request: BloodRequest, response: 'accepted' | 'declined', acceptedCount: number, now = Date.now()) {
  if (!['searching', 'matched'].includes(request.status)) return { ok: false as const, error: 'This emergency request is closed' };
  if (match.status !== 'alerted' || Date.parse(match.alertExpiresAt || match.alertedAt || '') <= now) return { ok: false as const, error: 'This alert has expired or was already answered', expire: match.status === 'alerted' };
  if (response === 'accepted' && acceptedCount >= request.unitsRequired) return { ok: false as const, error: 'Enough donors have already responded' };
  const nextAcceptedCount = acceptedCount + (response === 'accepted' ? 1 : 0);
  return {
    ok: true as const,
    matchPatch: { response, status: response, respondedAt: new Date(now).toISOString() } as Partial<Match>,
    requestStatus: response === 'accepted' && nextAcceptedCount >= request.unitsRequired ? 'matched' as const : undefined,
  };
}

export function updateJourney(match: Match, request: BloodRequest, location: Coordinates, now = Date.now()) {
  const remainingKm = distanceKm(location, request.hospitalLocation);
  const reached = remainingKm <= 0.15;
  return {
    trackingActive: !reached,
    message: reached ? 'Hospital reached; location sharing stopped' : 'Location updated',
    matchPatch: {
      status: reached ? 'reached' : 'en_route',
      donorCurrentLocation: reached ? null : location,
      distanceRemaining: reached ? 0 : Math.round(remainingKm * 1000),
      etaSeconds: reached ? 0 : Math.max(60, Math.round(remainingKm / 25 * 3600)),
      reachedAt: reached ? new Date(now).toISOString() : null,
    } as Partial<Match>,
  };
}

export function completeDonation(match: Match, donor: Donor, component: BloodComponent = 'whole_blood', now = Date.now()) {
  const timestamp = new Date(now).toISOString();
  const badges = new Set(donor.heroStats.badges || []);
  const donations = (donor.heroStats.totalDonations || 0) + 1;
  badges.add('life_pulse_hero');
  if (donations >= 3) badges.add('repeat_hero');
  if (donor.bloodGroup.endsWith('-')) badges.add('rare_blood_hero');
  if ((donor.heroStats.averageResponseTime || 9999) <= 600) badges.add('rapid_responder');
  if (donor.publicHeroConsent || donations >= 2) badges.add('community_champion');
  const donation = { id: match.id, donatedAt: timestamp, source: 'raktarun' as const, component };
  return {
    matchPatch: { status: 'donated', donationCompletedAt: timestamp, donorCurrentLocation: null, etaSeconds: null, distanceRemaining: null } as Partial<Match>,
    donorPatch: {
      lastDonationDate: timestamp,
      donationHistory: [...(donor.donationHistory || []), donation],
      heroStats: { ...donor.heroStats, totalEmergencyResponses: (donor.heroStats.totalEmergencyResponses || 0) + 1, totalDonations: donations, badges: [...badges], lastResponseDate: timestamp },
    } as Partial<Donor>,
  };
}
