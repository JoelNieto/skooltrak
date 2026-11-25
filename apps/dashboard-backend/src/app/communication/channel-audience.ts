import { personName } from '@/shared';
import { Channel, EnrollmentStatus, Prisma } from '@generated/prisma';
import { ACTIVE_ENROLLMENT, enrolledIn } from '../courses/course-roster';
import { PrismaService } from '../prisma.service';

/**
 * The part of a channel that decides its audience (BR-COM-003.4, .10). ASSIGNMENT channels also carry
 * their assignment's class groups, when loaded, for checks that don't query (`memberKinds`).
 */
export type AudienceChannel = Pick<
  Channel,
  'organizationId' | 'scope' | 'schoolId' | 'studyPlanId' | 'classGroupId' | 'courseId' | 'assignmentId' | 'audienceStudents' | 'audienceParents'
> & { assignment?: { dates: { classGroupId: string }[] } | null };

/**
 * BR-COM-003.11: archived, or an ASSIGNMENT channel past its close time. A closed channel stays
 * readable and takes no posts or replies.
 */
export function isClosed(channel: Pick<Channel, 'archivedAt' | 'closesAt'>, now = new Date()): boolean {
  return !!channel.archivedAt || (!!channel.closesAt && channel.closesAt <= now);
}

export type MemberKind = 'STUDENT' | 'PARENT';

export interface AudienceMember {
  userId: string;
  name: string;
  kind: MemberKind;
  /** Parents: the names of the children that put them in the audience. */
  students: string[];
}

/** BR .4: the active students at the channel's level. */
export function channelStudentWhere(channel: AudienceChannel): Prisma.StudentWhereInput {
  const base: Prisma.StudentWhereInput = {
    organizationId: channel.organizationId,
    enrollmentStatus: EnrollmentStatus.ACTIVE,
  };
  switch (channel.scope) {
    case 'ORGANIZATION':
      return base;
    case 'SCHOOL':
      return { ...base, schoolId: channel.schoolId ?? '' };
    case 'STUDY_PLAN':
      return { ...base, classGroup: { studyPlanId: channel.studyPlanId ?? '' } };
    case 'CLASS_GROUP':
      return { ...base, classGroupId: channel.classGroupId ?? '' };
    case 'COURSE':
      return { ...base, ...enrolledIn(channel.courseId ?? '') };
    case 'ASSIGNMENT':
      // BR .10: on the course roster, in a class group the assignment has a date for.
      return {
        ...base,
        ...enrolledIn(channel.courseId ?? ''),
        classGroup: { assignmentDates: { some: { assignmentId: channel.assignmentId ?? '' } } },
      };
  }
}

/** Everyone with an account in the channel's audience, by user id (a user appears once). */
export async function audienceMembers(prisma: PrismaService, channel: AudienceChannel): Promise<Map<string, AudienceMember>> {
  const studentWhere = channelStudentWhere(channel);
  const [students, parents] = await Promise.all([
    channel.audienceStudents
      ? prisma.student.findMany({
          where: { ...studentWhere, userId: { not: null } },
          select: { userId: true, user: { select: { name: true, firstName: true, lastName: true } } },
        })
      : Promise.resolve([]),
    channel.audienceParents
      ? prisma.parent.findMany({
          where: { organizationId: channel.organizationId, userId: { not: null }, students: { some: studentWhere } },
          select: {
            userId: true,
            user: { select: { name: true, firstName: true, lastName: true } },
            students: { where: studentWhere, select: { firstName: true, fatherName: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const members = new Map<string, AudienceMember>();
  for (const s of students) {
    if (s.userId) members.set(s.userId, { userId: s.userId, name: personName(s.user), kind: 'STUDENT', students: [] });
  }
  for (const p of parents) {
    if (!p.userId || members.has(p.userId)) continue;
    members.set(p.userId, {
      userId: p.userId,
      name: personName(p.user),
      kind: 'PARENT',
      students: p.students.map((s) => `${s.firstName} ${s.fatherName}`.trim()),
    });
  }
  return members;
}

/** Where a student sits, to work out which channels reach them. */
export interface StudentPlacement {
  organizationId: string;
  schoolId: string;
  studyPlanId: string | null;
  classGroupId: string | null;
  courseIds: string[];
}

/** The students a user is (as a student) and the children they follow (as a parent). */
export interface MemberContext {
  userId: string;
  asStudent: StudentPlacement[];
  asParent: StudentPlacement[];
}

const PLACEMENT_SELECT = {
  organizationId: true,
  schoolId: true,
  classGroupId: true,
  classGroup: { select: { studyPlanId: true } },
  courseEnrollments: { where: ACTIVE_ENROLLMENT, select: { courseId: true } },
} satisfies Prisma.StudentSelect;

type PlacementRow = Prisma.StudentGetPayload<{ select: typeof PLACEMENT_SELECT }>;

const toPlacement = (s: PlacementRow): StudentPlacement => ({
  organizationId: s.organizationId,
  schoolId: s.schoolId,
  studyPlanId: s.classGroup?.studyPlanId ?? null,
  classGroupId: s.classGroupId,
  courseIds: s.courseEnrollments.map((e) => e.courseId),
});

/**
 * The user's own student record and their linked children, across organizations (parents are
 * federated: one profile per organization).
 */
export async function memberContext(prisma: PrismaService, userId: string): Promise<MemberContext> {
  const active = { enrollmentStatus: EnrollmentStatus.ACTIVE };
  const [own, children] = await Promise.all([
    prisma.student.findMany({ where: { ...active, userId }, select: PLACEMENT_SELECT }),
    prisma.student.findMany({ where: { ...active, parents: { some: { userId } } }, select: PLACEMENT_SELECT }),
  ]);
  return { userId, asStudent: own.map(toPlacement), asParent: children.map(toPlacement) };
}

function placementWhere(p: StudentPlacement): Prisma.ChannelWhereInput {
  const levels: Prisma.ChannelWhereInput[] = [{ scope: 'ORGANIZATION' }, { scope: 'SCHOOL', schoolId: p.schoolId }];
  if (p.studyPlanId) levels.push({ scope: 'STUDY_PLAN', studyPlanId: p.studyPlanId });
  if (p.classGroupId) levels.push({ scope: 'CLASS_GROUP', classGroupId: p.classGroupId });
  if (p.courseIds.length) levels.push({ scope: 'COURSE', courseId: { in: p.courseIds } });
  if (p.courseIds.length && p.classGroupId) {
    levels.push({ scope: 'ASSIGNMENT', courseId: { in: p.courseIds }, assignment: { dates: { some: { classGroupId: p.classGroupId } } } });
  }
  return { organizationId: p.organizationId, OR: levels };
}

/** FR .7: the channels the user belongs to, now. Null when they belong to none. */
export function memberChannelWhere(ctx: MemberContext): Prisma.ChannelWhereInput | null {
  const or: Prisma.ChannelWhereInput[] = [
    ...ctx.asStudent.map((p) => ({ ...placementWhere(p), audienceStudents: true })),
    ...ctx.asParent.map((p) => ({ ...placementWhere(p), audienceParents: true })),
  ];
  return or.length ? { OR: or } : null;
}

function placed(channel: AudienceChannel, p: StudentPlacement): boolean {
  if (channel.organizationId !== p.organizationId) return false;
  switch (channel.scope) {
    case 'ORGANIZATION':
      return true;
    case 'SCHOOL':
      return channel.schoolId === p.schoolId;
    case 'STUDY_PLAN':
      return !!p.studyPlanId && channel.studyPlanId === p.studyPlanId;
    case 'CLASS_GROUP':
      return !!p.classGroupId && channel.classGroupId === p.classGroupId;
    case 'COURSE':
      return !!channel.courseId && p.courseIds.includes(channel.courseId);
    case 'ASSIGNMENT':
      return (
        !!channel.courseId &&
        p.courseIds.includes(channel.courseId) &&
        !!p.classGroupId &&
        (channel.assignment?.dates ?? []).some((d) => d.classGroupId === p.classGroupId)
      );
  }
}

/** How the user is in the channel's audience: as a student, as a parent, both or neither. */
export function memberKinds(channel: AudienceChannel, ctx: MemberContext): Set<MemberKind> {
  const kinds = new Set<MemberKind>();
  if (channel.audienceStudents && ctx.asStudent.some((p) => placed(channel, p))) kinds.add('STUDENT');
  if (channel.audienceParents && ctx.asParent.some((p) => placed(channel, p))) kinds.add('PARENT');
  return kinds;
}

/** BR .5: whether a member may reply. */
export function memberCanReply(
  channel: AudienceChannel & Pick<Channel, 'studentsCanReply' | 'parentsCanReply' | 'archivedAt' | 'closesAt'>,
  kinds: Set<MemberKind>,
): boolean {
  if (isClosed(channel)) return false;
  return (kinds.has('STUDENT') && channel.studentsCanReply) || (kinds.has('PARENT') && channel.parentsCanReply);
}

/** FR .15: posts by others in the user's channels that the user hasn't read. */
export async function unreadChannelPostCount(prisma: PrismaService, userId: string): Promise<number> {
  const where = memberChannelWhere(await memberContext(prisma, userId));
  if (!where) return 0;
  return prisma.channelPost.count({
    where: { deletedAt: null, channel: where, authorId: { not: userId }, reads: { none: { userId } } },
  });
}
