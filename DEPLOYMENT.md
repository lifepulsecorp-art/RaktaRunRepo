# Vercel, Firebase Auth, and Supabase setup

## 1. Prepare Supabase

1. Create a Supabase project and open **SQL Editor**.
2. Run [`supabase/migrations/202610180001_initial_schema.sql`](supabase/migrations/202610180001_initial_schema.sql). It creates the app tables and a private `donor-certificates` bucket.
3. Keep the bucket private. Certificate access goes through the authenticated admin API; do not make the bucket public.
4. Copy the project URL and the server secret key. The secret key belongs only in the backend environment.

The tables preserve the current application record shapes in a `payload` JSONB column. Collections include users, hospitals, donors, blood requests, matches, audit logs, buddy links and referrals, email verification challenges, blocked emails, and system configuration.

## 2. Migrate existing local data once

Before the first deployment, back up `server/data/`, create `server/.env` from `server/.env.example`, and set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and (if changed) `SUPABASE_CERTIFICATES_BUCKET`. Then, from the repository root, run:

```sh
npm --prefix server run migrate:json
```

This imports the existing JSON collections and uploads supported certificate files from `server/data/certificates/`. It reports files that are missing or unsupported. Run it once against the intended Supabase project; it replaces each imported collection with the local snapshot.

## 3. Configure Firebase Authentication

1. In Firebase Console, enable the sign-in provider used by the app.
2. Add the Vercel production and preview domains to Firebase Authentication's authorized domains.
3. Add the Firebase **Web app** values as Vercel environment variables for the `client` service: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`. `VITE_FIREBASE_MEASUREMENT_ID` is optional.
4. Set Firebase Admin values for the `api` service: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Store the private key as a Vercel secret; use `\n` escapes if the dashboard requires a single-line value.

Do not add Firebase Admin credentials, `SUPABASE_SECRET_KEY`, or Brevo keys to any `VITE_` variable.

## 4. Configure the Vercel API environment

Add these variables to the `api` service in Vercel for Preview and Production:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_CERTIFICATES_BUCKET` = `donor-certificates`
- `JWT_SECRET` and `OTP_SECRET` (use separate long random values)
- `ADMIN_EMAIL` = `admin@raktarun.in`
- `ADMIN_PASSWORD` = the private password for the admin account; keep it as a server secret
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`
- `ESCALATION_CRON_SECRET` (a long random value)
- `GROQ_API_KEY` if certificate AI review is enabled

The app uses `/api` on the same Vercel domain by default; no `VITE_API_URL` override is needed for this Services setup.

To change the existing admin account credentials without reseeding other records, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the API environment and run `npm run admin:rotate` from `server/` against the configured database. This updates only the admin record and stores a bcrypt hash.

## 5. Import and deploy from GitHub

1. Commit and push your changes to GitHub when you are ready.
2. Import the repository in Vercel with the repository root (`./`) selected.
3. Select the **Services** framework. The root [`vercel.json`](vercel.json) defines the Vite client at `/` and the Express API at `/api`.
4. Add the environment variables above to the matching `client` and `api` services, then redeploy after changing them.

The Express API exports its app for Vercel and starts a local listener only outside Vercel. Runtime records and uploaded certificates are stored in Supabase, not the deployment filesystem.

## 6. Schedule request escalation

The API exposes `GET /api/cron/escalation`, protected by `Authorization: Bearer <ESCALATION_CRON_SECRET>`. Configure a trusted scheduler to call it periodically. Vercel Hobby Cron is limited to once-daily runs, which is too slow for emergency request escalation; use a scheduler that supports minute-level calls or a plan with per-minute Cron support.

## Local development

Set the same server variables in `server/.env`, and the Firebase Web values in `client/.env`. Start the existing frontend/backend dev scripts as usual. To run escalation manually during local development, call the protected endpoint with the configured bearer secret.
