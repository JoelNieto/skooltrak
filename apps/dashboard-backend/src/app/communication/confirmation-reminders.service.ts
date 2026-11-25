import { sendEmail } from '@/auth';
import { personName } from '@/shared';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { audienceMembers } from './channel-audience';

/** BR-COM-003.15: a post is due a reminder this long after it was published. */
export const REMIND_AFTER_MS = 24 * 60 * 60 * 1000;
/** Posts older than this are never reminded about, so the job never walks the whole history. */
export const REMIND_WITHIN_MS = 30 * 24 * 60 * 60 * 1000;

/** Sends one email. Resend reports API failures in `error` instead of throwing. */
export type ReminderSender = (email: {
  to: string;
  subject: string;
  html: string;
}) => Promise<{ error?: unknown } | unknown>;
export const REMINDER_SENDER = Symbol('REMINDER_SENDER');

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * FR-COM-003.21: the reminder email. It names the channel and when the post was published, and links
 * to the channel; it never copies the post itself into the email (§8, minors' data).
 */
export function reminderEmail(input: {
  name: string;
  channel: string;
  publishedAt: Date;
  url: string;
  timeZone?: string;
}) {
  const when = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: input.timeZone }).format(input.publishedAt);
  const subject = `Confirma la lectura en «${input.channel}»`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 40px;">
      <h1 style="color: #18181b; font-size: 22px; font-weight: 600; margin: 0 0 24px 0;">Tienes una lectura por confirmar</h1>
      <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hola ${escape(input.name)},</p>
      <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        En el canal <strong>«${escape(input.channel)}»</strong> hay una publicación del ${escape(when)} que pide confirmar que la leíste.
      </p>
      <a href="${escape(input.url)}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Abrir el canal</a>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
      <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">Este es el único recordatorio que recibirás sobre esta publicación. Skooltrak.</p>
    </div>
  </div>
</body></html>`;
  return { subject, html };
}

/** BR-COM-003.15: who is due a reminder: the audience, minus who confirmed, was reminded, or wrote it. */
export function dueRecipients(
  audience: Iterable<string>,
  confirmed: Iterable<string>,
  reminded: Iterable<string>,
  authorId: string | null,
): string[] {
  const skip = new Set([...confirmed, ...reminded, ...(authorId ? [authorId] : [])]);
  return [...new Set(audience)].filter((id) => !skip.has(id));
}

/**
 * COM-003-S05 (FR .21, BR .15): every hour, one email to each audience member who hasn't confirmed a
 * post that asked for it 24 hours ago, in channels that are open. A reminder is recorded only once
 * the send succeeded, so a failure is retried next hour and a success is never repeated.
 */
@Injectable()
export class ConfirmationRemindersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REMINDER_SENDER) private readonly send: ReminderSender = sendEmail,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const { sent, failed } = await this.remindDue(new Date());
    // §8: counts only, never addresses or post bodies.
    if (sent || failed) console.log(`[Channels] confirmation reminders: ${sent} sent, ${failed} failed`);
  }

  async remindDue(now: Date): Promise<{ sent: number; failed: number }> {
    const posts = await this.prisma.channelPost.findMany({
      where: {
        requiresConfirmation: true,
        deletedAt: null,
        createdAt: { lte: new Date(now.getTime() - REMIND_AFTER_MS), gte: new Date(now.getTime() - REMIND_WITHIN_MS) },
        // BR .11: not archived and not past its close time.
        channel: { archivedAt: null, OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
      },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
        channel: true,
      },
    });
    const appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    let sent = 0;
    let failed = 0;

    for (const post of posts) {
      const [audience, confirmed, reminded] = await Promise.all([
        audienceMembers(this.prisma, post.channel),
        this.prisma.channelPostRead.findMany({
          where: { postId: post.id, confirmedAt: { not: null } },
          select: { userId: true },
        }),
        this.prisma.channelPostReminder.findMany({ where: { postId: post.id }, select: { userId: true } }),
      ]);
      const due = dueRecipients(
        audience.keys(),
        confirmed.map((r) => r.userId),
        reminded.map((r) => r.userId),
        post.authorId,
      );
      if (!due.length) continue;
      const users = await this.prisma.user.findMany({
        where: { id: { in: due }, email: { not: '' } },
        select: { id: true, email: true, name: true, firstName: true, lastName: true },
      });
      for (const user of users) {
        const { subject, html } = reminderEmail({
          name: personName(user),
          channel: post.channel.name,
          publishedAt: post.createdAt,
          url: `${appUrl}/communication/channels/${post.channel.id}`,
        });
        try {
          const result = (await this.send({ to: user.email, subject, html })) as { error?: unknown } | undefined;
          if (result?.error) throw result.error;
          await this.prisma.channelPostReminder.create({ data: { postId: post.id, userId: user.id } });
          sent++;
        } catch {
          // Retried next hour: nothing is recorded for a failed send.
          failed++;
        }
      }
    }
    return { sent, failed };
  }
}
