import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeRoles, type AuthenticatedRequest } from '../middleware/auth.js';
import type { BloodCamp, Donor, Hospital, User } from '../types.js';
import { filter, find, insert, readJson, update } from '../utils/db.js';
import { distanceKm } from '../services/matching.js';
import { sendEmailAlert, sendSmsAlert } from '../services/notificationService.js';

const router = Router();

function activeAt(camp: BloodCamp, now: number) {
  const end = Date.parse(camp.endsAt || new Date(Date.parse(camp.startsAt) + 24 * 60 * 60 * 1000).toISOString());
  return camp.status === 'active' && end > now;
}

router.get('/nearby', authenticate, authorizeRoles('donor'), async (req: AuthenticatedRequest, res) => {
  const donor = await find<Donor>('donors', (entry) => entry.uid === req.user!.uid || entry.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
  const now = Date.now();
  const camps = (await readJson<BloodCamp>('bloodCamps'))
    .filter((camp) => activeAt(camp, now) && Date.parse(camp.startsAt) <= now + 30 * 24 * 60 * 60 * 1000)
    .flatMap((camp) => {
      const distance = distanceKm(donor.coordinates, camp.coordinates);
      return Number.isFinite(distance) && distance <= camp.radiusKm
        ? [{ ...camp, distanceKm: Math.round(distance * 10) / 10 }]
        : [];
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return res.json(camps);
});

router.get('/mine', authenticate, authorizeRoles('hospital'), async (req: AuthenticatedRequest, res) => {
  const hospital = await find<Hospital>('hospitals', (entry) => entry.uid === req.user!.uid || entry.id === req.user!.hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Healthcare facility not found' });
  const camps = await filter<BloodCamp>('bloodCamps', (camp) => camp.hospitalId === hospital.id);
  return res.json(camps.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
});

router.post('/', authenticate, authorizeRoles('hospital'), async (req: AuthenticatedRequest, res) => {
  const hospital = await find<Hospital>('hospitals', (entry) => entry.uid === req.user!.uid || entry.id === req.user!.hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Healthcare facility not found' });
  if (hospital.verificationStatus !== 'verified') return res.status(403).json({ error: 'Your facility must be verified before posting a camp.' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const startsAt = typeof req.body?.startsAt === 'string' ? req.body.startsAt : '';
  const startTime = Date.parse(startsAt);
  const radius = Number(req.body?.radiusKm);
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : hospital.address;
  if (title.length < 4 || title.length > 100) return res.status(400).json({ error: 'Enter a camp title between 4 and 100 characters.' });
  if (message.length < 10 || message.length > 1000) return res.status(400).json({ error: 'Enter a camp message between 10 and 1000 characters.' });
  if (!Number.isFinite(startTime) || startTime < Date.now() - 60 * 60 * 1000) return res.status(400).json({ error: 'Choose a valid camp date and time.' });
  if (radius !== 5 && radius !== 10) return res.status(400).json({ error: 'Choose a 5 km or 10 km notification radius.' });

  const camp: BloodCamp = {
    id: `camp_${uuidv4().slice(0, 10)}`,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    title,
    message,
    address,
    coordinates: hospital.coordinates,
    radiusKm: radius,
    startsAt: new Date(startTime).toISOString(),
    ...(typeof req.body?.endsAt === 'string' && Number.isFinite(Date.parse(req.body.endsAt)) ? { endsAt: new Date(req.body.endsAt).toISOString() } : {}),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  if (camp.endsAt && Date.parse(camp.endsAt) <= startTime) return res.status(400).json({ error: 'The camp end time must be after its start time.' });
  await insert<BloodCamp>('bloodCamps', camp);

  const donors = await filter<Donor>('donors', (donor) => {
    const distance = distanceKm(camp.coordinates, donor.coordinates);
    return Number.isFinite(distance) && distance <= camp.radiusKm && donor.eligibilityStatus === 'eligible' && donor.availabilityStatus !== 'unavailable';
  });
  const users = await readJson<User>('users');
  const notified = await Promise.allSettled(donors.map(async (donor) => {
    const preferences = donor.notificationPreferences || { sms: true, email: true };
    const user = users.find((entry) => entry.uid === donor.uid);
    const email = donor.email || user?.email;
    const tasks: Promise<unknown>[] = [];
    const text = `RaktaRun blood camp: ${camp.title} at ${camp.hospitalName}, ${camp.address}. ${new Date(camp.startsAt).toLocaleString('en-IN')}. ${camp.message}`;
    if (preferences.sms !== false && donor.phone) tasks.push(sendSmsAlert(donor.phone, text));
    if (preferences.email !== false && email) {
      const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172033;background:#fffdf8;border:1px solid #eadfce;border-radius:16px"><p style="color:#a51e32;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Nearby RaktaRun blood camp</p><h1 style="font-size:22px">${escape(camp.title)}</h1><p><strong>Organizer:</strong> ${escape(camp.hospitalName)}</p><p><strong>Where:</strong> ${escape(camp.address)}</p><p><strong>When:</strong> ${new Date(camp.startsAt).toLocaleString('en-IN')}</p><p>${escape(camp.message)}</p><p style="color:#738093;font-size:12px">This announcement was sent to donors within ${camp.radiusKm} km of the camp.</p></div>`;
      tasks.push(sendEmailAlert(email, donor.fullName, `Nearby blood camp: ${camp.title}`, html));
    }
    return Promise.allSettled(tasks);
  }));
  const recipientCount = notified.filter((result) => result.status === 'fulfilled').length;
  return res.status(201).json({ camp, recipientsNotified: recipientCount });
});

router.delete('/:id', authenticate, authorizeRoles('hospital'), async (req: AuthenticatedRequest, res) => {
  const hospital = await find<Hospital>('hospitals', (entry) => entry.uid === req.user!.uid || entry.id === req.user!.hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Healthcare facility not found' });
  const camp = await find<BloodCamp>('bloodCamps', (entry) => entry.id === req.params.id && entry.hospitalId === hospital.id);
  if (!camp) return res.status(404).json({ error: 'Blood camp not found' });
  const updated = await update<BloodCamp>('bloodCamps', camp.id, { status: 'cancelled' });
  return res.json({ camp: updated });
});

export default router;
