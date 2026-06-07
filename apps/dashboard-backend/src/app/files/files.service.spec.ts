import { $Enums } from '@generated/prisma';
import { FilesService } from './files.service';

describe('FilesService access resolution', () => {
  const prismaMock = {} as any;
  const contextMock = {
    req: {
      user: { userId: 'user-1', organizationId: 'org-1' },
    },
  } as any;

  const service = new FilesService(prismaMock, contextMock, {} as any);

  const accessContext = {
    schoolIds: ['school-1'],
    classGroupIds: ['group-1'],
    courseIds: ['course-1'],
  };

  const baseFile = {
    ownerId: 'owner-1',
    sharesUsers: [],
    sharesSchools: [],
    sharesClassGroups: [],
    sharesCourses: [],
  } as any;

  it('returns EDIT for the owner', () => {
    const permission = (service as any).resolvePermission(
      { ...baseFile, ownerId: 'user-1' },
      'user-1',
      accessContext
    );

    expect(permission).toBe($Enums.FilePermission.EDIT);
  });

  it('returns VIEW when only view share matches', () => {
    const permission = (service as any).resolvePermission(
      {
        ...baseFile,
        sharesUsers: [
          { userId: 'user-1', permission: $Enums.FilePermission.VIEW },
        ],
      },
      'user-1',
      accessContext
    );

    expect(permission).toBe($Enums.FilePermission.VIEW);
  });

  it('prefers EDIT when any share grants edit', () => {
    const permission = (service as any).resolvePermission(
      {
        ...baseFile,
        sharesUsers: [
          { userId: 'user-1', permission: $Enums.FilePermission.VIEW },
        ],
        sharesSchools: [
          { schoolId: 'school-1', permission: $Enums.FilePermission.EDIT },
        ],
      },
      'user-1',
      accessContext
    );

    expect(permission).toBe($Enums.FilePermission.EDIT);
  });

  it('returns VIEW for matching class group share', () => {
    const permission = (service as any).resolvePermission(
      {
        ...baseFile,
        sharesClassGroups: [
          { classGroupId: 'group-1', permission: $Enums.FilePermission.VIEW },
        ],
      },
      'user-1',
      accessContext
    );

    expect(permission).toBe($Enums.FilePermission.VIEW);
  });

  it('returns null when no shares match', () => {
    const permission = (service as any).resolvePermission(
      baseFile,
      'user-1',
      accessContext
    );

    expect(permission).toBeNull();
  });
});
