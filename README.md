# 🩸 RaktaRun : Emergency Blood Donor Matching & Coordination Network

> *"Every minute matters. Connect. Locate. Respond. Save."*

**RaktaRun** is a mission-critical, real-time emergency blood donation matching and coordination system designed for the Coastal Karnataka region (**Udupi & Dakshina Kannada** districts). Rather than operating as an unverified public phone directory, RaktaRun connects trauma centers exclusively with **medically screened, verified blood donors** during acute emergencies and mass-casualty surges.

---

##  Key Innovations & Core Features

### 1.  Medically Verified Donor Network
- **Hospital-Issued Digital Medical Screening:** Donors must upload an authorized hospital-issued medical certificate (PDF, JPG, PNG) validating blood group, Rh factor, and health fitness before activation.
- **Accredited Screening Hospitals Directory:** Integrated directory with blood bank contacts and opening hours for donors needing certification.
- **Automated Donor Onboarding:** Base64 certificate upload with automated validation, PIN code mapping, and profile provisioning.

### 2.  Rule-Based Matching & Dynamic Escalation
- **Recipient-to-Donor Compatibility Matrix:** Comprehensive ABO/Rh matching engine ensuring zero blood mismatch errors.
- **Medical Donation Interval Enforcement:** Enforces strict intervals between donations: 90 days for Whole Blood/PRBC, 14 days for Platelets, and 28 days for Plasma.
- **Automated Radius Escalation:** Incremental radius expansion (+5 km increments up to 50 km) if initial batches do not fulfill units within configured timeout windows.
- **Urgency Filtering:** Supports Code Red Trauma Surge, Urgent (2h-4h), and Routine donor dispatch tiers.

### 3.  Interactive Maps & Turn-by-Turn GPS Navigation
- **Click-and-Drag Location Picker:** Interactive map allowing donors and hospitals to drag pins, search localities, or use high-accuracy browser geolocation.
- **Turn-by-Turn Mobile Navigation:** Instant one-click Google Maps turn-by-turn driving directions to the emergency department.
- **Privacy-Preserving Ephemeral Transit Radar:** Live donor tracking activates *only* after a donor accepts an emergency request and automatically terminates within 150m of hospital arrival.

### 4.  Real-Time Multi-Gateway Notifications (Powered by Brevo)
- **Brevo Transactional Email:** Automated HTML emails for account registration welcome and Code Red emergency dispatch alerts with interactive links.
- **Brevo SMS Gateway:** Automated SMS dispatch (`/v3/transactionalSMS/send`) formatted in international E.164 with Unicode support for real-time mobile alerting.
- **Channel Preferences:** Donors can customize alert channels (Email, SMS) and toggle "Critical Trauma Only (Code Red)" and "Emergency-Only Availability".

### 5.  Modern Human-Centric UI/UX
- **Shadcn-Inspired Clean Aesthetics:** Refined typography, rose/slate palettes, modern cards, and intuitive micro-interactions.
- **Light & Dark Mode:** Native theme switcher with persistent user preferences.
- **Responsive Layouts:** Desktop sidebar navigation with smooth scrolling and responsive mobile-first views.

### 6.  Community Recognition & Private Hero Studio
- **Public Hero Wall (`/heroes`):** Celebrates verified blood donors who opt in to community recognition.
- **Private Instagram Hero Share Studio (`/donor/hero-studio`):** Generates high-resolution 1:1 Square (1080x1080) and 9:16 Instagram Story (1080x1920) graphics for completed donations with 1-click download.
- **5 Recognition Badges:** RaktaRun Hero, Rapid Responder, Repeat Hero, Rare Blood Hero, and Community Champion.

### 7.  District Administration & Telemetry Console
- **District Filters:** Monitor requests, matches, and dispatches filtered across Udupi and Dakshina Kannada.
- **Live Rule Configuration:** Update batch timeouts, search radiuses, and escalation parameters in real time.
- **Audit Logging & CSV Export:** Download cryptographically sequenced audit logs for medical governance.

---

##  Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                      React 19 Frontend (client/)                       │
│  - Modern TypeScript + Vite + Tailwind CSS 4                           │
│  - Shadcn-style components, Lucide icons, Dark/Light Theme Switcher    │
│  - Interactive Location Picker & Live Transit Radar Map                │
│  - Donor Portal, Hospital Dispatch Console, Admin Telemetry            │
│  - Private Instagram Hero Share Studio & Public Hero Wall              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API + Bearer JWT Token
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Express Backend API (server/)                      │
│  - TypeScript + Node.js (tsx)                                          │
│  - Offline Local JWT Authentication & RBAC Middleware                  │
│  - Rule-Based Compatibility & Automated Escalation Engine              │
│  - Brevo Transactional Email & SMS Notification Engine                 │
│  - Ephemeral Live Transit Tracker (150m arrival cutoff)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Atomic Persistence
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Supabase Postgres + Private Object Storage                │
│  - User, hospital, donor, request, match, and audit records             │
│  - Private donor-certificate bucket; admins retrieve files through API  │
└────────────────────────────────────────────────────────────────────────┘
```

---

##  Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/lifepulsecorp-art/LifePulse.git
cd LifePulse

# Install all project dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in `server/` (reference `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_CERTIFICATES_BUCKET=donor-certificates
JWT_SECRET=use_a_long_random_secret
OTP_SECRET=use_a_different_long_random_secret
ADMIN_EMAIL=admin@raktarun.in
ADMIN_PASSWORD=set_the_admin_password_as_a_private_server_secret

# Brevo Transactional Email & SMS Gateway
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=lifepulsecorp@gmail.com
BREVO_SENDER_NAME=RaktaRun Emergency Network
```

For Firebase Web settings, create `client/.env` from `client/.env.example`. Set Firebase Admin and Supabase server secrets in `server/.env`; never use a `VITE_` prefix for server secrets.

To apply the configured admin email and password to the existing admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server environment, then run `npm run admin:rotate` from `server/`. The command updates only the admin account and stores the password as a bcrypt hash. Keep `ADMIN_PASSWORD` in the private server environment; do not put it in frontend code or public documentation.

### 4. Running the Application
```bash
# Start backend (port 5000) and frontend (port 5173) concurrently:
npm run dev

# Re-seed the demo database with verified mock data at any time:
npm run seed
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Public Hero Wall:** [http://localhost:5173/heroes](http://localhost:5173/heroes)

## ☁️ Vercel Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Supabase schema, one-time JSON data migration, Firebase Auth settings, Vercel Services configuration, environment variables, and escalation scheduler setup.

---

##  Pre-Seeded Demo Accounts

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
|  **System Admin** | `admin@raktarun.in` | Set `ADMIN_PASSWORD` in the server environment; run `npm run admin:rotate` to securely update the existing admin account. | District telemetry, live rule configuration, audit logs & CSV export |
|  **Hospital Staff** | `manipal@lifepulse.in` | `LifePulse@123` | Kasturba Hospital Manipal emergency blood requests & live tracking |
|  **Hospital Staff** | `ajhospital@lifepulse.in` | `LifePulse@123` | AJ Hospital Mangaluru trauma dispatch & fulfillment logs |
|  **Verified Donor** | `rahul.shetty@gmail.com` | `LifePulse@123` | O+ Screened Donor (7 donations, 5 emergency responses, Hero Studio) |
|  **Verified Donor** | `sneha.rao@gmail.com` | `LifePulse@123` | A+ Screened Donor with active alerts & channel preferences |

---

##  Testing & Verification

```bash
# Run server test suite (100% pass rate across matching and notifications):
npm run test --prefix server

# Run client production build:
npm run build --prefix client
```

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
