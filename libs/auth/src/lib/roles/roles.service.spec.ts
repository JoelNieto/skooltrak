import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    role: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      role: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('edits a global role (name/permissions) without reassigning organization', async () => {
      prisma.role.findUnique.mockResolvedValue({ organizationId: null });
      prisma.role.update.mockResolvedValue({ id: 'role-1' });

      await service.update('role-1', {
        id: 'role-1',
        name: 'Updated',
        permissionIds: ['perm-1', 'perm-2'],
      } as never);

      expect(prisma.role.update).toHaveBeenCalledTimes(1);
      const arg = prisma.role.update.mock.calls[0][0];
      expect(arg.data.organization).toBeUndefined();
      expect(arg.data.permissions).toEqual({
        set: [{ id: 'perm-1' }, { id: 'perm-2' }],
      });
    });

    it('rejects reassigning a global role to an organization', async () => {
      prisma.role.findUnique.mockResolvedValue({ organizationId: null });

      await expect(
        service.update('role-1', {
          id: 'role-1',
          organizationId: 'org-1',
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.role.update).not.toHaveBeenCalled();
    });

    it('updates an org-scoped role including its organization', async () => {
      prisma.role.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      prisma.role.update.mockResolvedValue({ id: 'role-2' });

      await service.update('role-2', {
        id: 'role-2',
        organizationId: 'org-2',
        permissionIds: ['perm-1'],
      } as never);

      const arg = prisma.role.update.mock.calls[0][0];
      expect(arg.data.organization).toEqual({ connect: { id: 'org-2' } });
    });
  });

  describe('remove', () => {
    it('throws when deleting a global role', async () => {
      prisma.role.findUnique.mockResolvedValue({ organizationId: null });

      await expect(service.remove('role-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.role.delete).not.toHaveBeenCalled();
    });

    it('deletes an org-scoped role', async () => {
      prisma.role.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      prisma.role.delete.mockResolvedValue({ id: 'role-2' });

      await service.remove('role-2');

      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-2' } });
    });
  });
});
