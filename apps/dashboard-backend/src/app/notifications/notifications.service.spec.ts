jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { NotificationsService } from './notifications.service';

/** ASM-001-S08 — the inbox: a user only ever reads and changes their own notifications. */
describe('NotificationsService', () => {
  const at = new Date('2026-11-21T10:00:00Z');
  function build() {
    const prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'n1', type: 'LOW_GRADE_HOMEROOM', title: 't', message: 'm', read: false, relatedId: 'G1:S1', createdAt: at },
        ]),
        count: jest.fn().mockResolvedValue(3),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    return { prisma, service: new NotificationsService(prisma as never) };
  }
  const user = { userId: 'u-1', organizationId: 'org-1', role: 'TEACHER' } as never;

  it("lists the caller's notifications, newest first, with the unread count", async () => {
    const { prisma, service } = build();
    const list = await service.list(user, { unread: true, type: 'LOW_GRADE_HOMEROOM', take: 500 });
    expect(list).toEqual({
      notifications: [{ id: 'n1', type: 'LOW_GRADE_HOMEROOM', title: 't', message: 'm', read: false, relatedId: 'G1:S1', createdAt: at.toISOString() }],
      unread: 3,
    });
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: 'u-1', read: false, type: 'LOW_GRADE_HOMEROOM' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: { recipientId: 'u-1', read: false } });
  });

  it('marks only the caller’s own notifications read', async () => {
    const { prisma, service } = build();
    await service.markRead(user, 'n9');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({ where: { id: 'n9', recipientId: 'u-1' }, data: { read: true } });
    await service.markAllRead(user);
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith({ where: { recipientId: 'u-1', read: false }, data: { read: true } });
  });

  it('refuses an anonymous caller', async () => {
    const { service } = build();
    await expect(service.list(undefined, {})).rejects.toThrow('Not authenticated');
  });
});
