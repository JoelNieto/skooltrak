import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Auth from '../auth/auth';
import GroupSchedule from './group-schedule';

const course = (id: string, name: string, code: string, teacherId: string, first: string) => ({
  id,
  name,
  code,
  shortName: code,
  color: null,
  teacherId,
  subject: { id: `s-${id}`, name, code },
  teacher: { id: teacherId, user: { firstName: first, lastName: 'Docente' } },
});
const MAT = course('c-mat', 'Matemática', 'MAT', 't1', 'Luis');
const ART = course('c-art', 'Expresiones Artísticas', 'ART', 't2', 'Elena');

const slot = (
  id: string,
  c: typeof MAT,
  weekday: string,
  startTime: string,
  endTime: string,
  location = 'Aula 12',
) => ({
  id,
  classGroupId: 'g1',
  courseId: c.id,
  course: c,
  weekday,
  startTime,
  endTime,
  location,
  remote: false,
  remoteLink: '',
  recess: false,
});

const SLOTS = [
  slot('a', MAT, 'MONDAY', '07:00', '08:30'),
  slot('b', ART, 'MONDAY', '12:30', '13:15'),
  slot('c', MAT, 'FRIDAY', '07:00', '08:30'),
];

describe('GroupSchedule', () => {
  let fixture: ComponentFixture<GroupSchedule>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function setup(canEdit: boolean) {
    await TestBed.configureTestingModule({
      imports: [GroupSchedule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: { hasPermission: () => canEdit } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GroupSchedule);
    fixture.componentRef.setInput('id', 'g1');
    fixture.componentRef.setInput('groupName', '7°A');
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne('/api/v1/groups-schedules/by-class-group/g1').flush(SLOTS);
    if (canEdit) {
      http.expectOne('/api/v1/courses/by-group/g1').flush([MAT, ART]);
      http
        .expectOne('/api/v1/groups-schedules/by-class-group/g1/teacher-busy')
        .flush([
          { id: 'x', weekday: 'MONDAY', startTime: '07:30', endTime: '08:15', teacherId: 't1', groupName: '7°B' },
        ]);
    }
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const button = (text: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('shows the week read-only for families, with hours per course', async () => {
    await setup(false);
    expect(button('Editar')).toBeUndefined();
    const blocks = el.querySelectorAll('.schedule-block');
    expect(blocks).toHaveLength(3);
    expect(blocks[0].getAttribute('aria-label')).toBe('Matemática, Lunes 07:00 a 08:30');
    const hours = el.querySelector('[aria-label="Horas por semana"]')?.textContent ?? '';
    expect(hours).toContain('3 h');
    expect(hours).toContain('3 h 45 min en total');
  });

  it('selects a class and shows its details', async () => {
    await setup(false);
    (el.querySelector('.schedule-block') as HTMLButtonElement).click();
    fixture.detectChanges();
    const card = el.querySelector('[aria-label="Clase seleccionada"]')?.textContent ?? '';
    expect(card).toContain('Lunes, 07:00 – 08:30 (1 h 30 min)');
    expect(card).toContain('Luis Docente');
    expect(card).toContain('Ir al curso');
  });

  it('in edit mode reviews clashes and free periods', async () => {
    await setup(true);
    button('Editar')?.click();
    fixture.detectChanges();
    const review = el.querySelector('[aria-label="Revisión del horario"]')?.textContent ?? '';
    expect(review).toContain('Sin choques entre clases del grupo');
    expect(review).toContain('Luis Docente también está con 7°B el lunes de 07:00 a 08:30');
    expect(review).toContain('viernes de 12:30 a 13:15 sin clase asignada');
    expect(el.querySelector('[aria-label="Agregar clase el viernes de 12:30 a 13:15"]')).toBeTruthy();
  });

  it('opens the add panel from a free period with its day and time', async () => {
    await setup(true);
    button('Editar')?.click();
    fixture.detectChanges();
    (el.querySelector('[aria-label="Agregar clase el viernes de 12:30 a 13:15"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const drawer = document.querySelector('app-group-schedule-form');
    expect(drawer?.querySelector('h2')?.textContent).toContain('Agregar clase');
    expect(drawer?.querySelector('[aria-label="Viernes"]')?.getAttribute('aria-pressed')).toBe('true');
    expect((drawer?.querySelector('input[type="time"]') as HTMLInputElement).value).toBe('12:30');
  });
});
