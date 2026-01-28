import { PrismaClient } from '@generated/prisma';
import * as bcrypt from 'bcrypt';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { sendEmail } from './resend.service';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can enable later
    password: {
      // Use bcrypt to verify existing passwords (migration compatibility)
      verify: async ({ password, hash }) => bcrypt.compare(password, hash),
      // New passwords use bcrypt
      hash: async (password) => bcrypt.hash(password, 10),
    },
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Reset your password - Skooltrak',
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
                <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Reset Your Password</h1>
                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi ${user.name || 'there'},</p>
                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">You requested to reset your password. Click the button below to set a new password:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Reset Password
                </a>
                <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Verify your email - Skooltrak',
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
                <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Verify Your Email</h1>
                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hi ${user.name || 'there'},</p>
                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Please verify your email address by clicking the button below:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Verify Email
                </a>
                <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">If you didn't create an account, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    },
  },
  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env['APP_URL']}/accept-invitation/${data.id}`;
        void sendEmail({
          to: data.email,
          subject: `You've been invited to ${data.organization.name} - Skooltrak`,
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
                  <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">You're Invited!</h1>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                    <strong>${data.inviter.user.name}</strong> has invited you to join <strong>${data.organization.name}</strong> on Skooltrak.
                  </p>
                  <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Click the button below to accept the invitation:</p>
                  <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Accept Invitation
                  </a>
                  <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">This invitation expires in 48 hours.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
