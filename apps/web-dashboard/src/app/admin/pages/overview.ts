import { Icon } from '#/ui';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Auth from '../../auth/auth';
import Store from '../../core/store';
import { AdminCounts } from '../admin-counts';

type StepState = 'done' | 'now' | 'todo';

interface SetupStep {
  label: string;
  path: string;
  /** What exists so far ("6 niveles"), or the step's state when nothing does. */
  summary: string;
  state: StepState;
}

interface OverviewLink {
  label: string;
  path: string;
  meta?: string;
}

interface OverviewGroup {
  title: string;
  description: string;
  links: OverviewLink[];
}

/**
 * The admin panel's landing page (`/admin`): how far the school's setup has come, what is waiting
 * for the admin, and a way into every section.
 */
@Component({
  selector: 'app-admin-overview',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="sr-only">Resumen</h2>

    <div class="flex flex-col gap-4.5 rounded-2xl border border-line bg-surface-1 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h3 class="type-heading-md text-ink-strong">
            @if (schoolName(); as name) {
              Prepara {{ name }}
            } @else {
              Prepara tu colegio
            }
          </h3>
          <p class="text-ink-muted">
            {{ doneCount() }} de {{ steps().length }} pasos listos.
            @if (nextStep(); as next) {
              Sigue con {{ next.label.toLowerCase() }}.
            } @else {
              La estructura académica está completa.
            }
          </p>
        </div>
        @if (nextStep(); as next) {
          <a
            [routerLink]="['/admin', next.path]"
            class="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4.5 font-semibold text-primary-content no-underline hover:no-underline"
          >
            Continuar con {{ next.label }}
            <ui-icon name="arrow-right" class="text-base" />
          </a>
        }
      </div>

      <div
        role="progressbar"
        aria-label="Progreso de la configuración"
        aria-valuemin="0"
        [attr.aria-valuemax]="steps().length"
        [attr.aria-valuenow]="doneCount()"
        [attr.aria-valuetext]="doneCount() + ' de ' + steps().length + ' pasos'"
        class="relative h-2.5 rounded-full bg-surface-2"
      >
        <div class="h-full rounded-full bg-primary transition-[width] duration-300" [style.width.%]="progress()"></div>
        @if (nextStep()) {
          <span
            class="absolute -top-1 box-border size-4.5 rounded-full border-3 border-surface-1 bg-new"
            [style.left]="'calc(' + progress() + '% - 9px)'"
            aria-hidden="true"
          ></span>
        }
      </div>

      <ol class="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
        @for (step of steps(); track step.path) {
          <li>
            <a [routerLink]="['/admin', step.path]" class="flex flex-col gap-1.5 text-[13px] no-underline hover:no-underline">
              <span
                class="box-border flex size-5.5 items-center justify-center rounded-full"
                [class]="
                  step.state === 'done'
                    ? 'bg-primary text-primary-content'
                    : step.state === 'now'
                      ? 'border-3 border-new bg-surface-1'
                      : 'border-2 border-line-strong bg-surface-1'
                "
              >
                @if (step.state === 'done') {
                  <ui-icon name="check" class="text-xs" />
                }
              </span>
              <span [class]="step.state === 'todo' ? 'font-medium text-ink-muted' : 'font-semibold text-ink-strong'">{{
                step.label
              }}</span>
              <span class="text-xs text-ink-subtle">{{ step.summary }}</span>
            </a>
          </li>
        }
      </ol>
    </div>

    @if (joinRequests(); as count) {
      <a
        routerLink="/admin/join-requests"
        class="flex items-center gap-3.5 rounded-2xl border border-line bg-surface-1 p-4 text-ink no-underline hover:border-line-strong hover:no-underline"
      >
        <span
          class="flex size-10 flex-none items-center justify-center rounded-full bg-new font-display text-base font-bold text-new-content"
          >{{ count > 99 ? '99+' : count }}</span
        >
        <span class="flex flex-1 flex-col gap-0.5">
          <span class="font-semibold text-ink-strong">
            {{ count === 1 ? 'Solicitud de ingreso nueva' : 'Solicitudes de ingreso nuevas' }}
          </span>
          <span class="text-[13px] text-ink-muted">Personas esperando tu aprobación</span>
        </span>
        <ui-icon name="chevron-right" class="text-lg text-ink-muted" />
      </a>
    }

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      @for (group of groups(); track group.title) {
        <div class="overflow-hidden rounded-2xl border border-line bg-surface-1">
          <div class="flex flex-col gap-0.5 px-4.5 pt-4 pb-3">
            <h3 class="font-display text-lg font-medium text-ink-strong">{{ group.title }}</h3>
            <p class="text-[13px] text-ink-muted">{{ group.description }}</p>
          </div>
          @for (link of group.links; track link.path) {
            <a
              [routerLink]="['/admin', link.path]"
              class="flex min-h-11 items-center gap-3 border-t border-line px-4.5 py-2.5 text-ink no-underline hover:bg-surface-0 hover:no-underline"
            >
              <span class="flex-1 font-medium text-ink-strong">{{ link.label }}</span>
              @if (link.meta) {
                <span class="text-[13px] text-ink-muted">{{ link.meta }}</span>
              }
              <ui-icon name="chevron-right" class="text-base text-ink-subtle" />
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
  `,
})
export default class AdminOverview {
  #counts = inject(AdminCounts);
  #store = inject(Store);
  #auth = inject(Auth);

  protected readonly schoolName = computed(() => this.#store.currentSchool()?.name);
  protected readonly joinRequests = computed(() => this.#counts.joinRequests());

  /**
   * The setup path, in the order each step depends on the one before. The first step with
   * nothing in it is the current one; a later step that already has data still counts as done.
   */
  protected readonly steps = computed<SetupStep[]>(() => {
    const c = this.#counts;
    const raw: Array<[label: string, path: string, count: number | undefined, unit: [string, string]]> = [
      ['Colegio', 'schools', c.schools(), ['colegio', 'colegios']],
      ['Niveles', 'degrees', c.degrees(), ['nivel', 'niveles']],
      ['Planes', 'study-plans', c.studyPlans(), ['plan', 'planes']],
      ['Asignaturas', 'subjects', c.subjects(), ['materia', 'materias']],
      ['Cursos', 'courses', c.courses(), ['curso', 'cursos']],
      ['Grupos', 'class-groups', c.classGroups(), ['grupo', 'grupos']],
    ];
    let currentFound = false;
    return raw.map(([label, path, count, [one, many]]) => {
      const done = (count ?? 0) > 0;
      let state: StepState = done ? 'done' : 'todo';
      if (!done && !currentFound) {
        state = 'now';
        currentFound = true;
      }
      const summary =
        count === undefined ? '—' : done ? `${count} ${count === 1 ? one : many}` : state === 'now' ? 'Siguiente' : 'Pendiente';
      return { label, path, summary, state };
    });
  });

  protected readonly doneCount = computed(() => this.steps().filter((s) => s.state === 'done').length);
  protected readonly nextStep = computed(() => this.steps().find((s) => s.state === 'now'));
  protected readonly progress = computed(() => Math.round((this.doneCount() / this.steps().length) * 100));

  protected readonly groups = computed<OverviewGroup[]>(() => {
    const c = this.#counts;
    const n = (value: number | undefined) => (value === undefined ? undefined : String(value));
    const requests = c.joinRequests();
    return [
      {
        title: 'Estructura académica',
        description: 'Cómo se organiza la enseñanza.',
        links: [
          { label: 'Niveles', path: 'degrees', meta: n(c.degrees()) },
          { label: 'Planes de estudio', path: 'study-plans', meta: n(c.studyPlans()) },
          { label: 'Asignaturas', path: 'subjects', meta: n(c.subjects()) },
          { label: 'Cursos', path: 'courses', meta: n(c.courses()) },
          { label: 'Grupos', path: 'class-groups', meta: c.classGroups() === 0 ? 'Sin crear' : n(c.classGroups()) },
        ],
      },
      {
        title: 'Comunidad',
        description: 'Familias, alumnos y altas en bloque.',
        links: [
          { label: 'Padres y acudientes', path: 'parents' },
          {
            label: 'Solicitudes de ingreso',
            path: 'join-requests',
            meta: requests === undefined ? undefined : requests === 0 ? 'Al día' : `${requests} nuevas`,
          },
          ...(this.#auth.hasPermission('MANAGE_STUDENTS') ? [{ label: 'Carga masiva', path: 'imports', meta: 'CSV' }] : []),
        ],
      },
      {
        title: 'Operación',
        description: 'El día a día del colegio.',
        links: [
          { label: 'Asistencia', path: 'attendance-reporting', meta: 'Reportes' },
          { label: 'Calendario de eventos', path: 'events-calendar' },
        ],
      },
      {
        title: 'General',
        description: 'Datos y marca de tus colegios.',
        links: [{ label: 'Colegios', path: 'schools', meta: n(c.schools()) }],
      },
    ];
  });
}

