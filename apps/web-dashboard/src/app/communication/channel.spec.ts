import type { ChannelDetail } from '@/shared';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Channel from './channel';
import { CommunicationApi } from './communication-api';

const detail: ChannelDetail = {
  id: 'general',
  scope: 'COURSE',
  targetName: 'Matemáticas 7°',
  schoolId: 's',
  studyPlanId: null,
  classGroupId: null,
  courseId: 'math',
  name: 'General',
  description: 'Dudas de la clase',
  audienceStudents: true,
  audienceParents: false,
  studentsCanReply: true,
  parentsCanReply: false,
  replyVisibility: 'PUBLIC',
  archived: false,
  role: 'MEMBER',
  unread: 1,
  lastPostAt: '2026-11-20T10:00:00Z',
  lastPostPreview: 'Traigan compás',
  canReply: true,
  posts: [
    {
      id: 'p1',
      body: 'Traigan compás el viernes.',
      author: null,
      createdAt: '2026-11-20T10:00:00Z',
      requiresConfirmation: false,
      readAt: null,
      confirmedAt: null,
      replyCount: 0,
      stats: null,
    },
  ],
};

/** ACA-001 FR .26, BR .20: the COM-003 channel view embedded in a course's Canales tab. */
describe('Channel', () => {
  let fixture: ComponentFixture<Channel>;
  const api = {
    channel: vi.fn().mockResolvedValue(detail),
    markChannelRead: vi.fn().mockResolvedValue({ marked: 1 }),
    refreshUnread: vi.fn(),
  };

  async function setup(embedded: boolean) {
    await TestBed.configureTestingModule({
      imports: [Channel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CommunicationApi, useValue: api },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Channel);
    fixture.componentRef.setInput('id', 'general');
    fixture.componentRef.setInput('embedded', embedded);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => vi.clearAllMocks());

  it('embedded: a compact header with "Abrir en pantalla completa" and no page header @FR-ACA-001.26', async () => {
    const el = await setup(true);
    expect(el.querySelector('lib-page-header')).toBeNull();
    expect(el.querySelector('h2')?.textContent).toContain('General');
    const full = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Abrir en pantalla completa'));
    expect(full?.getAttribute('href')).toBe('/communication/channels/general');
    expect(el.textContent).toContain('Traigan compás el viernes.');
  });

  it('on its own page keeps the page header', async () => {
    const el = await setup(false);
    expect(el.querySelector('lib-page-header')).not.toBeNull();
    expect(el.textContent).not.toContain('Abrir en pantalla completa');
  });

  it('marks the posts read and tells the host (FR-COM-003.8)', async () => {
    const read = vi.fn();
    await TestBed.configureTestingModule({
      imports: [Channel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CommunicationApi, useValue: api },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Channel);
    fixture.componentInstance.read.subscribe(read);
    fixture.componentRef.setInput('id', 'general');
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    expect(api.markChannelRead).toHaveBeenCalledWith('general');
  });
});
