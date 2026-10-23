import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readJson, update } from './db.js';
import type { User } from '../types.js';

const email = (process.env.ADMIN_EMAIL || 'admin@raktarun.in').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  throw new Error('Set ADMIN_PASSWORD in the server environment before rotating admin credentials.');
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('ADMIN_EMAIL must be a valid email address.');
}
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
  throw new Error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 bytes.');
}

const users = await readJson<User>('users');
const admins = users.filter((user) => user.role === 'admin');
if (admins.length !== 1) {
  throw new Error(`Expected exactly one admin user, found ${admins.length}; no account was changed.`);
}

const admin = admins[0];
const emailOwner = users.find((user) => user.email.toLowerCase() === email && user.uid !== admin.uid);
if (emailOwner) {
  throw new Error('ADMIN_EMAIL is already assigned to a non-admin account; no account was changed.');
}

const passwordHash = await bcrypt.hash(password, 10);
const updated = await update<User>('users', admin.uid, {
  email,
  passwordHash,
  emailVerified: true,
});

if (!updated) throw new Error('Admin account could not be updated.');
console.log(`Admin credentials updated for ${email}. The password was stored as a bcrypt hash.`);
