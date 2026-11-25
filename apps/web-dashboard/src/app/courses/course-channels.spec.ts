import type { ChannelSummary } from '@/shared';
import {
  askChannel,
  assignmentDueText,
  groupChannels,
  channelKind,
  courseChannels,
  newCount,
  newMessages,
  openChannelId,
  toAnswerTotal,
  unreadByCourse,
} from './course-channels';

const channel = (over: Partial<ChannelSummary>): ChannelSummary => ({
  id: 'c',
  scope: 'COURSE',
  targetName: 'Matemáticas 7°',
  schoolId: 's',
  studyPlanId: null,
  classGroupId: null,
  courseId: 'math',
  assignmentId: null,
  closesAt: null,
  name: 'Canal',
  description: '',
  audienceStudents: true,
  audienceParents: true,
  studentsCanReply: false,
  parentsCanReply: false,
  replyVisibility: 'PRIVATE',
  archived: false,
  role: 'MEMBER',
  unread: 0,
  toAnswer: 0,
  lastPostAt: null,
  lastPostPreview: null,
  ...over,
});

describe('courseChannels @FR-ACA-001.21', () => {
  it('keeps only COURSE channels of this course (BR-ACA-001.17)', () => {
    const list = [
      channel({ id: 'mine' }),
      channel({ id: 'other-course', courseId: 'spanish' }),
      channel({ id: 'group', scope: 'CLASS_GROUP', courseId: null, classGroupId: 'g' }),
      channel({ id: 'school', scope: 'SCHOOL', courseId: null }),
    ];
    expect(courseChannels(list, 'math', 'STUDENT').map((c) => c.id)).toEqual(['mine']);
  });

  it('puts open channels first by latest post, archived ones last', () => {
    const list = [
      channel({ id: 'old', lastPostAt: '2026-11-01T10:00:00Z' }),
      channel({ id: 'archived', archived: true, lastPostAt: '2026-11-22T10:00:00Z' }),
      channel({ id: 'empty', lastPostAt: null }),
      channel({ id: 'new', lastPostAt: '2026-11-20T10:00:00Z' }),
    ];
    expect(courseChannels(list, 'math', 'STUDENT').map((c) => c.id)).toEqual(['new', 'old', 'empty', 'archived']);
  });
});

describe('channelKind (BR-ACA-001.18)', () => {
  it('reads the reply setting of the viewer’s own audience', () => {
    const studentsTalk = channel({ studentsCanReply: true, replyVisibility: 'PUBLIC' });
    expect(channelKind(studentsTalk, 'STUDENT')).toBe('Conversación del curso');
    expect(channelKind(studentsTalk, 'PARENT')).toBe('Solo anuncios');

    const parentsAsk = channel({ parentsCanReply: true, replyVisibility: 'PRIVATE' });
    expect(channelKind(parentsAsk, 'PARENT')).toBe('Preguntas al docente');
    expect(channelKind(parentsAsk, 'STUDENT')).toBe('Solo anuncios');
  });
});

describe('channelKind for managers @FR-ACA-001.27', () => {
  it('reads whether anyone may reply', () => {
    expect(channelKind(channel({}), 'MANAGER')).toBe('Solo anuncios');
    expect(channelKind(channel({ parentsCanReply: true, replyVisibility: 'PUBLIC' }), 'MANAGER')).toBe(
      'Conversación del curso',
    );
    expect(channelKind(channel({ studentsCanReply: true, replyVisibility: 'PRIVATE' }), 'MANAGER')).toBe(
      'Preguntas al docente',
    );
  });
});

describe('newCount', () => {
  it('agrees in number', () => {
    expect(newCount(1)).toBe('1 nuevo');
    expect(newCount(3)).toBe('3 nuevos');
  });
});

describe('unreadByCourse @FR-ACA-001.23 @FR-ACA-001.24', () => {
  it('sums unread posts of open COURSE channels per course', () => {
    const list = [
      channel({ id: 'a', courseId: 'math', unread: 2 }),
      channel({ id: 'b', courseId: 'math', unread: 1 }),
      channel({ id: 'c', courseId: 'math', unread: 5, archived: true }),
      channel({ id: 'd', courseId: 'spanish', unread: 0 }),
      channel({ id: 'e', scope: 'CLASS_GROUP', courseId: null, classGroupId: 'g', unread: 4 }),
    ];
    expect([...unreadByCourse(list)]).toEqual([['math', 3]]);
  });

  it("also counts the course's open assignment Q&A channels (S22) @BR-ACA-001.17", () => {
    const list = [
      channel({ id: 'general', courseId: 'math', unread: 1 }),
      channel({ id: 'qa', scope: 'ASSIGNMENT', assignmentId: 'a1', courseId: 'math', unread: 2 }),
      channel({
        id: 'closed-qa',
        scope: 'ASSIGNMENT',
        assignmentId: 'a2',
        courseId: 'math',
        unread: 4,
        archived: true,
      }),
      channel({ id: 'qa-spanish', scope: 'ASSIGNMENT', assignmentId: 'a3', courseId: 'spanish', unread: 1 }),
    ];
    expect(Object.fromEntries(unreadByCourse(list))).toEqual({ math: 3, spanish: 1 });
  });

  it('agrees in number for the accessible name', () => {
    expect(newMessages(1)).toBe('1 mensaje nuevo.');
    expect(newMessages(4)).toBe('4 mensajes nuevos.');
  });
});

describe('askChannel @FR-ACA-001.25', () => {
  const talk = { studentsCanReply: true, replyVisibility: 'PUBLIC' as const };

  it('prefers the open course conversation with the latest post', () => {
    const list = [
      channel({ id: 'announcements', lastPostAt: '2026-11-23T10:00:00Z' }),
      channel({ id: 'older-talk', ...talk, lastPostAt: '2026-11-01T10:00:00Z' }),
      channel({ id: 'newer-talk', ...talk, lastPostAt: '2026-11-20T10:00:00Z' }),
      channel({ id: 'archived-talk', ...talk, archived: true, lastPostAt: '2026-11-24T10:00:00Z' }),
      channel({
        id: 'private-questions',
        studentsCanReply: true,
        replyVisibility: 'PRIVATE',
        lastPostAt: '2026-11-24T10:00:00Z',
      }),
    ];
    expect(askChannel(courseChannels(list, 'math', 'STUDENT'))?.id).toBe('newer-talk');
  });

  it('falls back to the latest open channel with private replies', () => {
    const ask = { studentsCanReply: true, replyVisibility: 'PRIVATE' as const };
    const list = [
      channel({ id: 'announcements', lastPostAt: '2026-11-23T10:00:00Z' }),
      channel({ id: 'older-questions', ...ask, lastPostAt: '2026-11-01T10:00:00Z' }),
      channel({ id: 'newer-questions', ...ask, lastPostAt: '2026-11-20T10:00:00Z' }),
      channel({ id: 'archived-talk', ...talk, archived: true, lastPostAt: '2026-11-24T10:00:00Z' }),
    ];
    expect(askChannel(courseChannels(list, 'math', 'STUDENT'))?.id).toBe('newer-questions');
  });

  it('is null when students can reply in no open channel', () => {
    const list = [
      channel({ id: 'announcements' }),
      channel({ id: 'archived-talk', ...talk, archived: true }),
      // Parents may reply here, students may not.
      channel({ id: 'parents-ask', parentsCanReply: true, replyVisibility: 'PRIVATE' }),
    ];
    expect(askChannel(courseChannels(list, 'math', 'STUDENT'))).toBeNull();
  });
});

describe('openChannelId @FR-ACA-001.26', () => {
  const list = courseChannels([channel({ id: 'general' }), channel({ id: 'announcements' })], 'math', 'STUDENT');

  it("opens the channel in the URL when it is one of the course's", () => {
    expect(openChannelId(list, 'announcements')).toBe('announcements');
  });

  it('opens nothing by itself, nor a channel outside the course (BR-ACA-001.17)', () => {
    expect(openChannelId(list, null)).toBeNull();
    expect(openChannelId(list, undefined)).toBeNull();
    expect(openChannelId(list, 'class-group-channel')).toBeNull();
  });
});

describe('toAnswerTotal @FR-ACA-001.28', () => {
  it("sums what waits for a manager in the course's open channels", () => {
    const list = courseChannels(
      [
        channel({ id: 'a', toAnswer: 2 }),
        channel({ id: 'b', toAnswer: 1 }),
        channel({ id: 'c', toAnswer: 4, archived: true }),
        channel({ id: 'other', courseId: 'spanish', toAnswer: 5 }),
      ],
      'math',
      'MANAGER',
    );
    expect(toAnswerTotal(list)).toBe(3);
    expect(toAnswerTotal([])).toBe(0);
  });
});

describe('assignment Q&A channels on the course page @FR-ACA-001.29', () => {
  const qa = (over: Partial<ChannelSummary> = {}) =>
    channel({
      scope: 'ASSIGNMENT',
      assignmentId: 'a1',
      studentsCanReply: true,
      replyVisibility: 'PUBLIC',
      closesAt: '2026-12-04T12:00:00Z',
      ...over,
    });

  it("lists the course's assignment channels with the course channels, in their own group (BR-ACA-001.17)", () => {
    const list = courseChannels(
      [channel({ id: 'general' }), qa({ id: 'qa' }), qa({ id: 'other-course', courseId: 'spanish' })],
      'math',
      'STUDENT',
    );
    expect(list.map((c) => c.id).sort()).toEqual(['general', 'qa']);
    const groups = groupChannels(list);
    expect(groups.course.map((c) => c.id)).toEqual(['general']);
    expect(groups.assignments.map((c) => c.id)).toEqual(['qa']);
  });

  it('says when it closes, or that it closed, instead of a reply kind', () => {
    expect(channelKind(qa(), 'STUDENT')).toBe('Cierra el 04/12/2026');
    expect(channelKind(qa({ archived: true }), 'STUDENT')).toBe('Preguntas cerradas');
    expect(channelKind(qa({ closesAt: null }), 'MANAGER')).toBe('Preguntas de la asignación');
  });

  it('is never where "Preguntar en el curso" goes (FR-ACA-001.25)', () => {
    expect(askChannel(courseChannels([qa({ lastPostAt: '2026-11-24T10:00:00Z' })], 'math', 'STUDENT'))).toBeNull();
  });

  it("describes the due dates: one for a student's group, one per group for staff", () => {
    expect(assignmentDueText([])).toBe('Sin fecha de entrega');
    expect(assignmentDueText([{ date: '2026-12-01T12:00:00Z' }])).toBe('Entrega: 01/12/2026');
    expect(
      assignmentDueText([
        { date: '2026-12-04T12:00:00Z', classGroup: { name: '7°B' } },
        { date: '2026-12-01T12:00:00Z', classGroup: { name: '7°A' } },
      ]),
    ).toBe('Entregas: 7°A 01/12/2026 · 7°B 04/12/2026');
  });
});
