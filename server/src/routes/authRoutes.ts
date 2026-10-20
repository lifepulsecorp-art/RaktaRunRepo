import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { find, insert, remove, update } from '../utils/db.js';
import type { EmailVerificationChallenge, User, Donor, Hospital, UserRole } from '../types.js';
import { isEmailBlocked } from '../utils/accountRestrictions.js';
import { sendEmailAlert } from '../services/notificationService.js';

const router = Router();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function otpDigest(email: string, code: string): string {
  const secret = process.env.OTP_SECRET?.trim() || JWT_SECRET;
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function issueToken(user: User): string {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function sendVerificationCode(challenge: EmailVerificationChallenge, code: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#172033;background:#fffdf8;border:1px solid #eadfce;border-radius:16px">
      <p style="margin:0 0 8px;color:#a51e32;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">RaktaRun account verification</p>
      <h1 style="margin:0 0 16px;font-size:24px;color:#172033">Verify your email address</h1>
      <p style="font-size:15px;line-height:1.6">Hello ${escapeHtml(challenge.name)}, enter this 6-digit code to finish creating your account:</p>
      <div style="margin:24px 0;padding:18px;text-align:center;border:1px solid #eadfce;border-radius:12px;background:#fff">
        <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#a51e32">${code}</span>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#526071">This code expires in 10 minutes and can be used once. If you did not request this code, you can ignore this email.</p>
      <hr style="border:0;border-top:1px solid #eadfce;margin:24px 0" />
      <p style="margin:0;text-align:center;font-size:12px;color:#738093">RaktaRun • Coastal Karnataka Emergency Response</p>
    </div>`;

  return sendEmailAlert(
    challenge.email,
    challenge.name,
    'Your RaktaRun email verification code',
    html
  );
}

// POST /api/auth/login - Issue a session only for email-verified accounts.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email address and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await isEmailBlocked(normalizedEmail)) {
    return res.status(403).json({ error: 'This email address is not permitted to create a RaktaRun account.' });
  }
  const user = (await find<User>('users', (u) => u.email.toLowerCase() === normalizedEmail));

  if (!user) {
    const pendingVerification = (await find<EmailVerificationChallenge>('emailVerifications', (challenge) => challenge.email === normalizedEmail));
    if (pendingVerification) return res.status(403).json({ error: 'Verify your email with the 6-digit code before signing in.' });
    return res.status(401).json({ error: 'Account not found. Register first.' });
  }
  if (user.emailVerified === false) {
    return res.status(403).json({ error: 'Verify your email with the 6-digit code before signing in.' });
  }
  if (user.passwordHash && !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  const token = issueToken(user);
  let roleData: any = null;
  if (user.role === 'donor') {
    roleData = (await find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId)) || null;
  } else if (user.role === 'hospital') {
    roleData = (await find<Hospital>('hospitals', (h) => h.uid === user.uid || h.id === user.hospitalId)) || null;
  }

  res.json({ message: 'Login successful', token, user: publicUser(user), profile: roleData });
});

// POST /api/auth/register - Existing signed-in users may finish onboarding; new users must verify email first.
router.post('/register', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    await authenticate(req as AuthenticatedRequest, res, () => undefined);
    if (res.headersSent || !(req as AuthenticatedRequest).user) return;
    const user = (req as AuthenticatedRequest).user!;
    const { role, displayName } = req.body;
    const patch: Partial<User> = {};
    if (displayName) patch.name = displayName;
    if (role && ['donor', 'hospital'].includes(role) && user.role !== 'admin') patch.role = role;
    const updatedUser = (await update<User>('users', user.uid, patch)) || user;
    const token = issueToken(updatedUser);
    return res.status(200).json({ message: 'User profile updated', token, user: publicUser(updatedUser) });
  }

  const { email, password, role, displayName, name } = req.body;
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 bytes.' });
  }
  if (!['donor', 'hospital'].includes(role)) {
    return res.status(400).json({ error: 'Choose donor or hospital registration.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await isEmailBlocked(normalizedEmail)) {
    return res.status(403).json({ error: 'This email address is not permitted to create a RaktaRun account.' });
  }
  if ((await find<User>('users', (user) => user.email.toLowerCase() === normalizedEmail))) {
    return res.status(409).json({ error: 'An account already exists for this email. Sign in instead.' });
  }

  const pending = (await find<EmailVerificationChallenge>('emailVerifications', (challenge) => challenge.email === normalizedEmail));
  if (pending) {
    return res.status(409).json({ error: 'Email verification is already pending. Enter the code or request a new one.' });
  }

  const timestamp = new Date();
  const code = String(randomInt(100000, 1000000));
  const challenge: EmailVerificationChallenge = {
    id: normalizedEmail,
    uid: `user_${uuidv4().slice(0, 8)}`,
    email: normalizedEmail,
    name: String(displayName || name || normalizedEmail.split('@')[0]).trim().slice(0, 100),
    role: role as UserRole,
    passwordHash: await bcrypt.hash(password, 10),
    codeHash: otpDigest(normalizedEmail, code),
    expiresAt: new Date(timestamp.getTime() + OTP_TTL_MS).toISOString(),
    resendAvailableAt: new Date(timestamp.getTime() + OTP_RESEND_DELAY_MS).toISOString(),
    attempts: 0,
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
  };
  (await insert<EmailVerificationChallenge>('emailVerifications', challenge));

  const result = await sendVerificationCode(challenge, code);
  if (!result.success) {
    (await remove<EmailVerificationChallenge>('emailVerifications', challenge.id));
    return res.status(503).json({ error: result.error || 'Could not send the verification email. Check Brevo configuration and try again.' });
  }

  return res.status(202).json({ message: 'Verification code sent to your email.', verificationRequired: true });
});

// POST /api/auth/register/resend-otp
router.post('/register/resend-otp', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ error: 'Email address is required.' });
  const challenge = (await find<EmailVerificationChallenge>('emailVerifications', (entry) => entry.email === email));
  if (!challenge) return res.status(404).json({ error: 'No pending verification was found. Start registration again.' });

  const now = Date.now();
  const nextAllowed = Date.parse(challenge.resendAvailableAt);
  if (Number.isFinite(nextAllowed) && nextAllowed > now) {
    return res.status(429).json({ error: `Wait ${Math.ceil((nextAllowed - now) / 1000)} seconds before requesting another code.` });
  }

  const code = String(randomInt(100000, 1000000));
  const updated = (await update<EmailVerificationChallenge>('emailVerifications', challenge.id, {
    codeHash: otpDigest(email, code),
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    resendAvailableAt: new Date(now + OTP_RESEND_DELAY_MS).toISOString(),
    attempts: 0,
  }));
  if (!updated) return res.status(404).json({ error: 'Verification request expired. Start registration again.' });

  const result = await sendVerificationCode(updated, code);
  if (!result.success) return res.status(503).json({ error: result.error || 'Could not send the verification email.' });
  return res.json({ message: 'A new verification code was sent.' });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!email || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Enter the 6-digit code sent to your email.' });
  }

  const challenge = (await find<EmailVerificationChallenge>('emailVerifications', (entry) => entry.email === email));
  if (!challenge) return res.status(400).json({ error: 'No pending email verification was found. Start registration again.' });
  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    (await remove<EmailVerificationChallenge>('emailVerifications', challenge.id));
    return res.status(400).json({ error: 'This code expired. Request a new verification code.' });
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code before trying again.' });
  }

  const expected = Buffer.from(challenge.codeHash, 'hex');
  const supplied = Buffer.from(otpDigest(email, code), 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    const attempts = challenge.attempts + 1;
    (await update<EmailVerificationChallenge>('emailVerifications', challenge.id, { attempts }));
    return res.status(attempts >= OTP_MAX_ATTEMPTS ? 429 : 400).json({
      error: attempts >= OTP_MAX_ATTEMPTS ? 'Too many incorrect attempts. Request a new code before trying again.' : 'That code is incorrect. Check the email and try again.',
    });
  }

  const existing = (await find<User>('users', (user) => user.email.toLowerCase() === email));
  if (existing) {
    (await remove<EmailVerificationChallenge>('emailVerifications', challenge.id));
    return res.status(409).json({ error: 'An account already exists for this email. Sign in instead.' });
  }

  const timestamp = new Date().toISOString();
  const user: User = {
    uid: challenge.uid,
    email,
    role: challenge.role,
    name: challenge.name,
    emailVerified: true,
    passwordHash: challenge.passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  (await insert<User>('users', user));
  (await remove<EmailVerificationChallenge>('emailVerifications', challenge.id));
  const token = issueToken(user);
  return res.json({ message: 'Email verified.', token, user: publicUser(user) });
});

// GET /api/auth/me - Return the authenticated user and related role profile.
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let roleData: any = null;
  if (user.role === 'donor') roleData = (await find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId)) || null;
  else if (user.role === 'hospital') roleData = (await find<Hospital>('hospitals', (h) => h.uid === user.uid || h.id === user.hospitalId)) || null;
  res.json({ user: publicUser(user), profile: roleData });
});

// POST /api/auth/sync - Update user details.
router.post('/sync', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, phone, hospitalId, donorId } = req.body;
  const patch: Partial<User> = {};
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  if (hospitalId) patch.hospitalId = hospitalId;
  if (donorId) patch.donorId = donorId;
  const updatedUser = (await update<User>('users', user.uid, patch)) || user;

  // Keep role-specific records aligned with the account details used by the rest of the app.
  if (user.role === 'donor' && (name || phone)) {
    const donor = (await find<Donor>('donors', (entry) => entry.uid === user.uid || entry.id === updatedUser.donorId));
    if (donor) {
      const donorPatch: Partial<Donor> = {};
      if (name) donorPatch.fullName = String(name).trim();
      if (phone) donorPatch.phone = String(phone).trim();
      (await update<Donor>('donors', donor.id, donorPatch));
    }
  } else if (user.role === 'hospital' && (name || phone)) {
    const hospital = (await find<Hospital>('hospitals', (entry) => entry.uid === user.uid || entry.id === updatedUser.hospitalId));
    if (hospital) {
      const hospitalPatch: Partial<Hospital> = {};
      if (name) hospitalPatch.name = String(name).trim();
      if (phone) hospitalPatch.bloodBankContact = { ...hospital.bloodBankContact, phone: String(phone).trim() };
      (await update<Hospital>('hospitals', hospital.id, hospitalPatch));
    }
  }
  res.json({ message: 'Profile synchronized', user: publicUser(updatedUser) });
});

export default router;
