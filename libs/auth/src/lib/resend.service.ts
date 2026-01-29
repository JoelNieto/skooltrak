import { Resend } from 'resend';

const apiKey = process.env['RESEND_API_KEY'];

if (!apiKey) {
  console.warn('[Email Service] RESEND_API_KEY is not set');
}

const resend = new Resend(apiKey);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env['EMAIL_FROM'] || 'noreply@skooltrak.com';

  console.log(`[Email Service] Sending email to: ${to}, subject: ${subject}`);
  console.log(`[Email Service] From: ${from}`);

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log('[Email Service] Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    throw error;
  }
}
