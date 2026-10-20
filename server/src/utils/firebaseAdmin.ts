import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (projectId && clientEmail && privateKey) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    console.log('Firebase Admin initialized from environment configuration.');
  }
} else if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
      console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
    }
  } catch (error: any) {
    console.warn('Could not initialize Firebase Admin SDK (continuing in Local Auth mode):', error.message);
  }
} else {
  if (process.env.VERCEL) {
    throw new Error('Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY for the API service.');
  }
  console.log('Running in Local Auth mode (firebase-service-account.json not found).');
}

export default admin;
