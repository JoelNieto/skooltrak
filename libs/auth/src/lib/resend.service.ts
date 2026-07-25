import { PrismaClient } from '@generated/prisma';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

const apiKey = process.env['RESEND_API_KEY'];

if (!apiKey) {
  console.warn('[Email Service] RESEND_API_KEY is not set');
}

const resend = new Resend(apiKey);

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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

export async function sendWelcomeEmail({
  to,
  name,
  role,
  organizationName,
  resetPasswordUrl,
}: {
  to: string;
  name: string;
  role: 'teacher' | 'student';
  organizationName: string;
  resetPasswordUrl: string;
}) {
  const roleLabel = role === 'teacher' ? 'docente' : 'estudiante';
  const subject = `Bienvenido a Skooltrak - Configura tu cuenta`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">¡Bienvenido a Skooltrak!</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hola ${name},</p>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
            Se ha creado una cuenta de ${roleLabel} para ti en <strong>${organizationName}</strong>.
          </p>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Para comenzar a usar tu cuenta, necesitas establecer tu contraseña haciendo clic en el siguiente botón:
          </p>
          <a href="${resetPasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Configurar Contraseña
          </a>
          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
            Este enlace expira en 24 horas. Si no solicitaste esta cuenta, puedes ignorar este correo.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
          <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">
            Este correo fue enviado por Skooltrak. Si tienes preguntas, contacta a tu administrador.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`[Email Service] Sending welcome email to ${role}: ${to}`);

  return sendEmail({ to, subject, html });
}

/**
 * Sends a welcome invitation email to a newly created user (teacher or student).
 * Generates a password reset token and sends a welcome email with a link to set the password.
 */
export async function sendUserInvitation({
  prisma,
  email,
  name,
  role,
  organizationName,
}: {
  prisma: PrismaClient;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  organizationName: string;
}) {
  const appUrl = process.env['APP_URL'] || 'http://localhost:4200';

  // Generate a unique token for password reset
  const token = randomUUID();

  // Store the verification token (expires in 24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier: email,
      value: token,
      expiresAt,
    },
  });

  // Build the password reset URL (include email for resend flow when link expires)
  const resetPasswordUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`[Email Service] Generated invitation for ${role} ${email}`);
  console.log(`[Email Service] Reset URL: ${resetPasswordUrl}`);

  // Send the welcome email
  return sendWelcomeEmail({
    to: email,
    name,
    role,
    organizationName,
    resetPasswordUrl,
  });
}

/**
 * Sends an email notification when a grade has been published to students/parents.
 */
export async function sendGradePublishedEmail({
  to,
  studentName,
  gradeTitle,
  courseName,
}: {
  to: string;
  studentName: string;
  gradeTitle: string;
  courseName: string;
}) {
  const subject = `Nueva calificación publicada - ${gradeTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Nueva calificación publicada</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
            Se ha publicado una nueva calificación para <strong>${studentName}</strong>.
          </p>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
            <strong>Curso:</strong> ${courseName}<br>
            <strong>Calificación:</strong> ${gradeTitle}
          </p>
          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
            Inicia sesión en la plataforma para ver los detalles completos del informe de calificaciones.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
          <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">
            Este correo fue enviado por Skooltrak.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Sends a passwordless magic-link email. The link logs the user in exactly
 * once and expires, so it must never be confused with a reset-password link.
 */
export async function sendMagicLinkEmail({
  to,
  name,
  magicLinkUrl,
}: {
  to: string;
  name: string;
  magicLinkUrl: string;
}) {
  const subject = 'Tu enlace de acceso a Skooltrak';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Enlace de acceso</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hola ${name},</p>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Haz clic en el botón para iniciar sesión sin contraseña. Este enlace funciona una sola vez y expira pronto.
          </p>
          <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Iniciar sesión
          </a>
          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
            Si no solicitaste este enlace, puedes ignorar el correo. Nadie más podrá usarlo.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
          <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">
            Este correo fue enviado por Skooltrak.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
