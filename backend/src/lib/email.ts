import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST?.trim() ?? '';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '587');
const SMTP_USER = process.env.SMTP_USER?.trim() ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const SMTP_FROM = process.env.SMTP_FROM?.trim() ?? SMTP_USER;

function hasSmtpConfig(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
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
      <p style="margin:0 0 10px; color:#d8ae67; font-size:13px; letter-spacing:0.12em; text-transform:uppercase;">SportyGo Security</p>
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

  await transporter.sendMail({
    from: SMTP_FROM,
    to: input.email,
    subject,
    text,
    html,
  });
}