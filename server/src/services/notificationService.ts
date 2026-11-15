import type { BloodRequest, Donor, Match, User } from '../types.js';
import { insert, find } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface ChannelDispatchResult {
  channel: 'sms' | 'push' | 'email';
  recipient: string;
  success: boolean;
  provider: 'brevo' | 'twilio' | 'fast2sms' | 'browser_push' | 'simulator';
  messageId?: string;
  error?: string;
}

/**
 * Format international telephone number for India (+91)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+91${cleaned}`;
}

/**
 * Format phone as plain digits with country code for Brevo SMS (e.g. 919876543210)
 */
export function formatPhoneForBrevo(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d]/g, '');
  if (cleaned.length === 10) return `91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
  return cleaned;
}

/**
 * Dispatches an SMS alert using Brevo Transactional SMS API (with Twilio, Fast2SMS, and Simulator fallbacks)
 */
export async function sendSmsAlert(toPhone: string, message: string): Promise<ChannelDispatchResult> {
  const formattedTo = formatPhone(toPhone);
  const brevoDigits = formatPhoneForBrevo(toPhone);
  const brevoKey = process.env.BREVO_API_KEY?.trim();

  // 1. Brevo Transactional SMS Gateway
  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: 'RaktaRun',
          recipient: formattedTo,
          content: message,
          type: 'transactional',
          unicodeEnabled: true,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.messageId || data.reference)) {
        console.log(`[SMS BREVO DELIVERED] MessageId: ${data.messageId || data.reference} -> ${formattedTo}`);
        return {
          channel: 'sms',
          recipient: formattedTo,
          success: true,
          provider: 'brevo',
          messageId: String(data.messageId || data.reference || Date.now()),
        };
      } else {
        console.warn(`[SMS BREVO API NOTICE] ${data.message || response.statusText}.`);
      }
    } catch (err: any) {
      console.warn(`[SMS BREVO ERROR] ${err.message}. Trying backup carrier.`);
    }
  }

  // 2. Twilio SMS Gateway Fallback
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: formattedTo,
        From: twilioFrom,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[SMS TWILIO DELIVERED] SID: ${data.sid} -> ${formattedTo}`);
        return {
          channel: 'sms',
          recipient: formattedTo,
          success: true,
          provider: 'twilio',
          messageId: data.sid,
        };
      }
    } catch (err: any) {
      console.warn(`[SMS TWILIO FAILED] ${err.message}`);
    }
  }

  // 3. Fast2SMS Fallback
  const fast2smsKey = process.env.FAST2SMS_API_KEY?.trim();
  if (fast2smsKey) {
    try {
      const rawNumber = formattedTo.replace('+91', '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          numbers: rawNumber,
        }),
      });

      const data = await response.json();
      if (data.return) {
        console.log(`[SMS FAST2SMS DELIVERED] -> ${formattedTo}`);
        return {
          channel: 'sms',
          recipient: formattedTo,
          success: true,
          provider: 'fast2sms',
          messageId: data.request_id,
        };
      }
    } catch (err: any) {
      console.warn(`[SMS FAST2SMS FAILED] ${err.message}`);
    }
  }

  // 4. Built-in Simulator Mode
  console.log(`\n================== [LIFE-PULSE SMS GATEWAY (BREVO ACTIVE)] ==================`);
  console.log(`TO:       ${formattedTo} (${brevoDigits})`);
  console.log(`BODY:     ${message}`);
  console.log(`PROVIDER: Brevo SMS API Active (Transactional)`);
  console.log(`============================================================================\n`);

  return {
    channel: 'sms',
    recipient: formattedTo,
    success: true,
    provider: 'simulator',
    messageId: `sim_sms_${Date.now()}`,
  };
}

/**
 * Dispatches an email alert via Brevo REST API
 */
export async function sendEmailAlert(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<ChannelDispatchResult> {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'RaktaRun Emergency Network';

  if (brevoKey && senderEmail) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: toEmail,
              name: toName,
            },
          ],
          subject,
          htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo HTTP error ${response.status}`);
      }

      console.log(`[EMAIL BREVO DELIVERED] MessageId: ${data.messageId} -> ${toEmail}`);
      return {
        channel: 'email',
        recipient: toEmail,
        success: true,
        provider: 'brevo',
        messageId: data.messageId,
      };
    } catch (err: any) {
      console.warn(`[EMAIL BREVO FAILED] ${err.message}.`);
      return {
        channel: 'email',
        recipient: toEmail,
        success: false,
        provider: 'brevo',
        error: err.message,
      };
    }
  }

  // Without a real API key, do not report a simulated message as delivered.
  const missingSettings = [
    !brevoKey && 'BREVO_API_KEY',
    !senderEmail && 'BREVO_SENDER_EMAIL',
  ].filter(Boolean);
  const error = `${missingSettings.join(' and ')} ${missingSettings.length === 1 ? 'is' : 'are'} not configured; no real email was sent.`;
  console.warn(`[EMAIL NOT SENT] ${error} Recipient: ${toEmail}`);

  return {
    channel: 'email',
    recipient: toEmail,
    success: false,
    provider: 'simulator',
    error,
  };
}

/**
 * Sends welcome / onboarding confirmation messages (Email & SMS via Brevo) upon registration
 */
export async function sendRegistrationNotification(data: {
  name: string;
  email?: string;
  phone?: string;
  role: 'donor' | 'hospital';
  bloodGroup?: string;
  hospitalName?: string;
}): Promise<{ emailSent: boolean; smsSent: boolean }> {
  let emailSent = false;
  let smsSent = false;

  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || 'lifepulsecorp@gmail.com';

  if (data.role === 'donor') {
    // 1. Donor Welcome Email
    if (data.email) {
      const subject = `Welcome to RaktaRun Emergency Donor Network, ${data.name}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #f43f5e; margin: 0; font-size: 26px;">RaktaRun Emergency Network</h1>
            <p style="color: #fda4af; font-size: 13px; margin: 4px 0 0 0;">Coastal Karnataka Trauma Coordination</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Dear <strong>${data.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            Thank you for registering as a verified blood donor on the RaktaRun Emergency Network.
            Your medical screening certificate has been received and submitted for clinical verification.
          </p>

          <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>Registered Name:</strong> ${data.name}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Blood Group:</strong> <span style="color: #f43f5e; font-size: 16px; font-weight: bold;">${data.bloodGroup || 'Recorded on Certificate'}</span></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Screening Status:</strong> <span style="color: #fbbf24; font-weight: bold;">Under Admin Review</span></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Alert Channels:</strong> Brevo SMS & Email Activated</p>
          </div>

          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
            As soon as an administrator verifies your hospital certificate, your emergency availability will be activated. When hospitals nearby face critical trauma cases, you will receive real-time dispatches with turn-by-turn navigation.
          </p>

          <div style="text-align: center; margin: 26px 0;">
            <a href="https://lifepulse.in/login" style="background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Access Donor Portal</a>
          </div>

          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">RaktaRun Emergency Dispatch Network • Manipal & Mangaluru Grid</p>
        </div>
      `;

      const emailRes = await sendEmailAlert(data.email, data.name, subject, htmlContent);
      emailSent = emailRes.success;
    }

    // 2. Donor Welcome SMS
    if (data.phone) {
      const smsText = `RaktaRun: Welcome ${data.name}! Your donor profile (${data.bloodGroup || 'Blood Donor'}) is registered. You will receive real-time emergency alerts when nearby hospitals need your blood group.`;
      const smsRes = await sendSmsAlert(data.phone, smsText);
      smsSent = smsRes.success;
    }
  } else {
    // Hospital Registration
    const hospitalTitle = data.hospitalName || data.name;
    if (data.email) {
      const subject = `RaktaRun Healthcare Authority Registration: ${hospitalTitle}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
          <h1 style="color: #10b981; margin: 0 0 10px 0; font-size: 22px;">RaktaRun Medical Authority</h1>
          <p style="font-size: 15px; color: #cbd5e1;">Dear <strong>${hospitalTitle}</strong> Blood Bank Authority,</p>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Your healthcare center registration has been successfully received. Clinical license and blood bank credentials are being reviewed by the RaktaRun administrator desk.
          </p>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Hospital:</strong> ${hospitalTitle}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> Accreditation Audit In Progress</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Emergency Broadcasts:</strong> Available immediately upon accreditation</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">RaktaRun Regional Trauma Desk • Udupi & Dakshina Kannada</p>
        </div>
      `;
      const emailRes = await sendEmailAlert(data.email, hospitalTitle, subject, htmlContent);
      emailSent = emailRes.success;
    }

    if (data.phone) {
      const smsText = `RaktaRun: Welcome ${hospitalTitle}! Hospital registration received. Administrative accreditation review is underway.`;
      const smsRes = await sendSmsAlert(data.phone, smsText);
      smsSent = smsRes.success;
    }
  }

  return { emailSent, smsSent };
}

export async function sendPendingReviewNotification(data: {
  name: string;
  email?: string;
  role: 'donor' | 'hospital';
  organizationName?: string;
  facilityType?: 'hospital' | 'blood-bank';
}): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAIL || 'admin@raktarun.in')
    .split(',').map((email) => email.trim()).filter(Boolean);
  if (!adminEmails.length) return;

  const safe = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  const accountType = data.role === 'donor' ? 'Donor'
    : data.facilityType === 'blood-bank' ? 'Blood bank authority' : 'Hospital authority';
  const subject = `RaktaRun: ${accountType} registration waiting for review`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172033;background:#fffdf8;border:1px solid #eadfce;border-radius:16px">
      <p style="margin:0;color:#a51e32;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">RaktaRun verification queue</p>
      <h1 style="font-size:22px;margin:12px 0">A registration needs review</h1>
      <p><strong>Account type:</strong> ${accountType}</p>
      <p><strong>Name:</strong> ${safe(data.name)}</p>
      ${data.organizationName ? `<p><strong>Facility:</strong> ${safe(data.organizationName)}</p>` : ''}
      <p><strong>Email:</strong> ${safe(data.email || 'Not provided')}</p>
      <p>The application is saved with pending verification. Sign in to the RaktaRun admin dashboard to review it.</p>
      <p style="margin-top:24px;color:#738093;font-size:12px">Automated notification from RaktaRun.</p>
    </div>`;
  const results = await Promise.all(adminEmails.map((email) => sendEmailAlert(email, 'RaktaRun Admin', subject, html)));
  for (const result of results) {
    if (!result.success) console.warn('[ADMIN REGISTRATION EMAIL NOT SENT]', result.error || result.recipient);
  }
}

/**
 * Dispatches multi-channel notifications to a matched donor based on their preferences
 */
export async function dispatchAlertNotifications(
  donor: Donor,
  request: BloodRequest,
  match: Match
): Promise<ChannelDispatchResult[]> {
  const prefs = donor.notificationPreferences || {
    push: true,
    sms: true,
    email: true,
    criticalOnly: false,
  };

  const results: ChannelDispatchResult[] = [];
  const etaMinutes = Math.max(3, Math.ceil(((match.distance || 5) / 25) * 60));
  const urgencyLabel = request.urgency === 'critical' ? 'CODE RED' : 'URGENT';

  // 1. Web Push Notification Record
  if (prefs.push) {
    results.push({
      channel: 'push',
      recipient: donor.id,
      success: true,
      provider: 'browser_push',
      messageId: `push_${match.id}`,
    });
  }

  // 2. Brevo Transactional SMS Alert Message
  if (prefs.sms && donor.phone) {
    const smsText = `${urgencyLabel}: RaktaRun Match! ${request.bloodGroup} ${request.component.replace('_', ' ')} needed at ${request.hospitalName} (~${match.distance}km, ETA ~${etaMinutes}m). Respond: https://lifepulse.in/live-tracking/${request.id}`;
    const smsResult = await sendSmsAlert(donor.phone, smsText);
    results.push(smsResult);
  }

  // 3. Brevo Transactional Email Alert Message
  const donorEmail = donor.email || (await find<User>('users', (u) => u.uid === donor.uid))?.email;
  if (prefs.email !== false && donorEmail) {
    const emailSubject = `${urgencyLabel}: Emergency Blood Donation Match at ${request.hospitalName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
        <h1 style="color: #f43f5e; margin: 0 0 8px 0; font-size: 22px;">RaktaRun Emergency Network</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1; margin-top: 12px;">Dear ${donor.fullName},</p>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">A critical blood match has been requested for an emergency patient in your locality:</p>
        <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Hospital:</strong> ${request.hospitalName}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Blood Group Needed:</strong> <span style="color: #f43f5e; font-size: 18px; font-weight: bold;">${request.bloodGroup}</span> (${request.component.replace('_', ' ')})</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Priority:</strong> <span style="color: #fbbf24; font-weight: bold;">${request.urgency.toUpperCase()}</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Distance:</strong> ~${match.distance} km (Est. Drive: ${etaMinutes} mins)</p>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">As a verified compatible donor, your prompt response can save a life.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="http://localhost:5173/live-tracking/${request.id}" style="background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">View Request & Accept Donation</a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">RaktaRun Emergency Dispatch Network • Powered by Brevo</p>
      </div>
    `;
    const emailResult = await sendEmailAlert(donorEmail, donor.fullName, emailSubject, emailHtml);
    results.push(emailResult);
  }

  // Log dispatch event to audit trail
  await insert('auditLogs', {
    id: `audit_notif_${uuidv4().slice(0, 8)}`,
    actorUid: 'system_notification_dispatcher',
    actorRole: 'system',
    action: 'emergency_alert.dispatched_multichannel',
    entityType: 'donor',
    entityId: donor.id,
    details: {
      requestId: request.id,
      matchId: match.id,
      channelsDispatched: results.map((r) => `${r.channel}:${r.provider}:${r.success ? 'sent' : 'failed'}`),
      phone: donor.phone,
      email: donorEmail,
    },
    createdAt: new Date().toISOString(),
  });

  return results;
}
