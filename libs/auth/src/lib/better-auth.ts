import { PrismaClient } from '@generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { sendEmail } from './resend.service';

function createOpenApiAuthStub(): ReturnType<typeof betterAuth> {
  return {
    options: {
      trustedOrigins: ['http://localhost:4200', 'http://localhost:4201'],
      hooks: {},
    },
    handler: ((_req: unknown, _res: unknown) => undefined) as unknown as ReturnType<
      typeof betterAuth
    >['handler'],
  } as ReturnType<typeof betterAuth>;
}

function createProductionAuth(): ReturnType<typeof betterAuth> {
  console.log('[Better Auth] Initializing...');
  console.log(
    '[Better Auth] DATABASE_URL:',
    process.env['DATABASE_URL'] ? 'Set' : 'NOT SET',
  );

  const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL']!,
  });
  const prisma = new PrismaClient({ adapter });

  console.log('[Better Auth] Creating betterAuth instance with basePath: /api/auth');

  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    basePath: '/api/auth',
    trustedOrigins: [
      'http://localhost:4200',
      'http://localhost:4201',
      process.env['APP_URL'] || 'http://localhost:3000',
      ...(process.env['TRUSTED_ORIGINS']
        ? process.env['TRUSTED_ORIGINS'].split(',').map((o) => o.trim())
        : []),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        verify: async ({ password, hash }) => bcrypt.compare(password, hash),
        hash: async (password) => bcrypt.hash(password, 10),
      },
      sendResetPassword: async ({ user, url }) => {
        console.log('[Better Auth] sendResetPassword called for:', user.email);
        console.log('[Better Auth] Reset URL:', url);
        try {
          await sendEmail({
            to: user.email,
            subject: 'Restablecer contraseña - Skooltrak',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Restablecer Contraseña</h1>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hola ${user.name || ''},</p>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para establecer una nueva:</p>
                  <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Restablecer Contraseña
                  </a>
                  <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">Este enlace expira en 1 hora. Si no solicitaste esto, puedes ignorar este correo.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          });
          console.log('[Better Auth] Password reset email sent successfully');
        } catch (error) {
          console.error('[Better Auth] Failed to send password reset email:', error);
        }
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        console.log('[Better Auth] sendVerificationEmail called for:', user.email);
        try {
          await sendEmail({
            to: user.email,
            subject: 'Verifica tu correo - Skooltrak',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Verifica tu Correo</h1>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hola ${user.name || ''},</p>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
                  <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Verificar Correo
                  </a>
                  <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">Si no creaste una cuenta, puedes ignorar este correo.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          });
          console.log('[Better Auth] Verification email sent successfully');
        } catch (error) {
          console.error('[Better Auth] Failed to send verification email:', error);
        }
      },
    },
    plugins: [
      organization({
        sendInvitationEmail: async (data) => {
          console.log('[Better Auth] sendInvitationEmail called for:', data.email);
          const inviteLink = `${process.env['APP_URL']}/accept-invitation/${data.id}`;
          try {
            await sendEmail({
              to: data.email,
              subject: `Has sido invitado a ${data.organization.name} - Skooltrak`,
              html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">¡Has sido invitado!</h1>
                    <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                      <strong>${data.inviter.user.name}</strong> te ha invitado a unirte a <strong>${data.organization.name}</strong> en Skooltrak.
                    </p>
                    <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Haz clic en el botón de abajo para aceptar la invitación:</p>
                    <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                      Aceptar Invitación
                    </a>
                    <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">Esta invitación expira en 48 horas.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            });
            console.log('[Better Auth] Invitation email sent successfully');
          } catch (error) {
            console.error('[Better Auth] Failed to send invitation email:', error);
          }
        },
      }),
    ],
  });
}

/** Cast avoids a union type when OPENAPI_EXPORT is only used by tooling. */
export const auth = (
  process.env['OPENAPI_EXPORT'] === 'true'
    ? createOpenApiAuthStub()
    : createProductionAuth()
) as ReturnType<typeof betterAuth>;

export type Session = typeof auth.$Infer.Session;
