import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST?.trim() ?? '';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '587');
const SMTP_USER = process.env.SMTP_USER?.trim() ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const SMTP_FROM = process.env.SMTP_FROM?.trim() ?? SMTP_USER;

function hasSmtpConfig(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

  const SPORTYGO_BRAND_HTML = '<span style="font-weight:800;color:#ed1c24;">S</span><span style="font-weight:800;color:#f5f5f5;">porty</span><span style="font-weight:800;color:#ed1c24;">G</span><span style="font-weight:800;color:#f5f5f5;">o</span>';

export type BookingConfirmationEmail = {
  email: string;
  receiptId: string;
  status: 'confirmed' | 'cash_pending';
  paymentStatus: 'paid' | 'pending';
  facilityTitle: string;
  facilityAddress: string;
  slotDate: string;
  slotTime: string;
  durationMins: number;
  amount: number;
};

export async function sendBookingConfirmationEmail(input: BookingConfirmationEmail): Promise<void> {
  if (!hasSmtpConfig()) {
    console.warn('[booking:confirmation] SMTP not configured; email not sent.', input.email);
    return;
  }

  const statusLabel = input.paymentStatus === 'paid' ? 'Payment successful' : 'Payment pending';
  const subject = `SportyGo booking ${input.receiptId} confirmed`;
  const text = [
    'SportyGo booking confirmation',
    `Status: ${statusLabel}`,
    `Booking ID: ${input.receiptId}`,
    `Facility: ${input.facilityTitle}`,
    `Address: ${input.facilityAddress}`,
    `Date: ${input.slotDate}`,
    `Time: ${input.slotTime}`,
    `Duration: ${input.durationMins} minutes`,
    `Amount: S$${input.amount.toFixed(2)}`,
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;background:#051328;color:#edf1f7;padding:24px;max-width:560px;border-radius:16px;">
      <p style="margin:0 0 8px;font-size:20px;letter-spacing:.02em;">${SPORTYGO_BRAND_HTML}</p>
      <h1 style="margin:0 0 8px;font-size:26px;">Booking Confirmation</h1>
      <p style="color:#7ccf57;font-weight:700;">${escapeHtml(statusLabel)}</p>
      <div style="border-top:1px solid #273a57;border-bottom:1px solid #273a57;padding:16px 0;">
        <p><strong>Booking ID</strong><br>${escapeHtml(input.receiptId)}</p>
        <p><strong>Facility</strong><br>${escapeHtml(input.facilityTitle)}</p>
        <p><strong>Address</strong><br>${escapeHtml(input.facilityAddress)}</p>
        <p><strong>Date &amp; time</strong><br>${escapeHtml(input.slotDate)} · ${escapeHtml(input.slotTime)}</p>
        <p><strong>Duration</strong><br>${input.durationMins} minutes</p>
        <p style="font-size:20px;color:#e12633;font-weight:800;"><strong>Total</strong><br>S$${input.amount.toFixed(2)}</p>
      </div>
      <p style="color:#c6cfdd;">Please keep this email for your records.</p>
    </div>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: SMTP_FROM, to: input.email, subject, text, html });
}

export async function sendPasswordResetPasscode(input: { email: string; code: string }): Promise<void> {
  const subject = 'SportyGo password reset code';
  const text = [
    'Your SportyGo password reset code is:',
    input.code,
    '',
    'This code expires in 10 minutes.',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#051328; color:#edf1f7; padding:24px; border-radius:16px; border:1px solid rgba(212,165,86,0.28); max-width:520px;">
      <p style="margin:0 0 10px; font-size:20px; letter-spacing:0.02em;">${SPORTYGO_BRAND_HTML}<span style="font-size:13px;font-weight:500;color:#f5f5f5;letter-spacing:0.12em;text-transform:uppercase;"> Security</span></p>
      <h1 style="margin:0 0 12px; font-size:28px; line-height:1.1;">Password Reset</h1>
      <p style="margin:0 0 16px; color:#c6cfdd;">Use this 6-digit passcode to reset your SportyGo password.</p>
      <div style="display:inline-block; padding:14px 20px; border-radius:14px; background:linear-gradient(180deg,#cd2028 0%,#b81421 100%); color:#fff7f7; font-size:28px; font-weight:800; letter-spacing:0.28em;">${input.code}</div>
      <p style="margin:18px 0 0; color:#c6cfdd;">This code expires in 10 minutes.</p>
      <p style="margin:8px 0 0; color:#8f9ab1; font-size:14px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  if (!hasSmtpConfig()) {
    console.log(`[auth:reset-code] SMTP not configured. Email=${input.email} Code=${input.code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const result = await transporter.sendMail({
    from: SMTP_FROM,
    to: input.email,
    subject,
    text,
    html,
  });

  console.log(`[email:password-reset] SMTP accepted=${result.accepted.length} rejected=${result.rejected.length}`);
}