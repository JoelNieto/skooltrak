import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import MySchedulePage, { ScheduleAudience } from './my-schedule-page';
import { MySchedule, MyScheduleSlot } from './week-schedule';

const slot = (id: string, weekday: string, startTime: string, endTime: string, group = '7°A'): MyScheduleSlot =>
  ({
    id,
    weekday,
    startTime,
    endTime,
    location: 'Aula 12',
    remote: false,
    remoteLink: '',
    recess: false,
    course: {
      id: `c-${id}`,
      name: 'Matemática 7',
      shortName: 'MAT',
      code: 'MAT7',
      color: 'INDIGO',
      subject: { name: 'Matemática', code: 'MAT' },
    },
    teacherName: 'Luis Herrera',
    group: { id: `g-${group}`, name: group },
  }) as MyScheduleSlot;

const STUDENT: MySchedule = {
  kind: 'STUDENT',
  name: 'Sofía Méndez',
  group: { id: 'g-7°A', name: '7°A' },
  now: { weekday: 'MONDAY', time: '07:20' },
  slots: [
    slot('a', 'MONDAY', '07:00', '09:15'),
    slot('b', 'MONDAY', '09:35', '10:20'),
    slot('c', 'TUESDAY', '07:00', '09:15'),
    slot('d', 'TUESDAY', '09:35', '10:20'),
  ],
};

const TEACHER: MySchedule = {
  kind: 'TEACHER',
  name: 'Luis Herrera',
  group: null,
  now: { weekday: 'SATURDAY', time: '10:00' },
  slots: [
    slot('a', 'MONDAY', '07:00', '07:45', '7°A'),
    slot('b', 'MONDAY', '07:45', '08:30', '7°B'),
    slot('c', 'FRIDAY', '07:00', '07:45', '7°B'),
  ],
};

describe('MySchedulePage', () => {
  let fixture: ComponentFixture<MySchedulePage>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function setup(audience: ScheduleAudience) {
    await TestBed.configureTestingModule({
      imports: [MySchedulePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(MySchedulePage);
    fixture.componentRef.setInput('audience', audience);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
    TestBed.tick();
  }

  async function render() {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it("shows a student's week with the group's break and the class going on now", async () => {
    await setup('student');
    http.expectOne('/api/v1/groups-schedules/mine').flush(STUDENT);
    await render();
    expect(el.textContent).toContain('Sofía Méndez · 7°A');
    expect(el.textContent).toContain('Recreo');
    const blocks = el.querySelectorAll('[aria-label="Horario de la semana"] button');
    expect(blocks[0].getAttribute('aria-label')).toBe('Matemática, Lunes 07:00 a 09:15, Luis Herrera');
    expect(el.querySelector('[aria-label="Siguiente clase"]')?.textContent).toContain('Ahora');
  });

  it("asks for the selected child's schedule and names the child", async () => {
    await setup('parent');
    http.expectOne('/api/v1/home/parent/children').flush({
      defaultStudentId: 'S2',
      children: [
        {
          studentId: 'S1',
          name: 'Pedro Méndez',
          organizationId: 'o',
          classGroup: null,
          school: { id: 's', name: 'S' },
        },
        {
          studentId: 'S2',
          name: 'Sofía Méndez',
          organizationId: 'o',
          classGroup: null,
          school: { id: 's', name: 'S' },
        },
      ],
    });
    // Let the children response land, then the schedule request for the default child goes out.
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    http
      .expectOne((r) => r.url === '/api/v1/groups-schedules/mine' && r.params.get('studentId') === 'S2')
      .flush(STUDENT);
    await render();
    expect(el.querySelector('h1')?.textContent).toContain('Horario de Sofía');
    expect(el.querySelector('[aria-label="Elegir hijo"]')?.textContent).toContain('Pedro Méndez');
  });

  it("shows a teacher's classes with their groups and the week per group", async () => {
    await setup('teacher');
    http.expectOne('/api/v1/groups-schedules/mine').flush(TEACHER);
    await render();
    expect(el.textContent).toContain('3 clases en 2 grupos por semana');
    expect(el.textContent).not.toContain('Recreo');
    const load = el.querySelector('[aria-label="Horas por semana"]')?.textContent ?? '';
    expect(load).toContain('Clases por grupo');
    expect(load).toContain('2 clases');
    expect(load).toContain('2 h 15 min en total');
    const block = el.querySelector('[aria-label="Horario de la semana"] button');
    expect(block?.textContent).toContain('7°A · Aula 12');
  });
});
