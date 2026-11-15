import { Alert, Button, Card, CardBody, EmptyState, PageHeader, Spinner, StatCard } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toFetchQueryParams } from './core/fetch-query-params';
import Store from './core/store';
import WelcomeBanner from './shared/welcome-banner';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type Ref = { id: string; name: string };

/** `GET /api/v1/home/admin/attention` (HOM-001 FR .5 .24). */
type AdminAttention = {
  firstName: string;
  school: Ref;
  timezone: string;
  date: string;
  time: string;
  period: Ref | null;
  periodClose: {
    name: string;
    endDate: string;
    daysLeft: number;
    coursesWithMissingGrades: number;
    totalCourses: number;
  } | null;
  currencyCode: string;
  tiles: {
    joinRequests: { total: number; teachers: number; parents: number; others: number; oldestAt: string | null };
    broadcastsToApprove: number;
    missedAttendance: number;
    overdueCharges: { count: number; amount: number; families: number } | null;
    failedImports: number;
    plansWithoutScale: number;
  };
};

/** `GET /api/v1/home/admin/kpis` (HOM-001 FR .25). */
type AdminKpis = {
  students: { active: number; candidates: number };
  attendanceToday: { rate: number | null; absent: number; late: number; lastWeekRate: number | null };
  collection: { rate: number | null; collected: number; billed: number } | null;
  passing: { evaluated: number; rate: number | null; belowPass: number; allExcellent: number } | null;
  currencyCode: string;
};

type AttentionTile = { icon: string; iconClass: string; count: number; label: string; detail: string; link: string };

const percent = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('es-MX');
const longDate = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

type RecentStudent = {
  id: string;
  fullName: string;
  createdAt: string;
  classGroup?: { name: string } | null;
};

type RecentTeacher = {
  id: string;
  fullName: string;
  createdAt: string;
  user?: { email?: string | null } | null;
};

type InboxRow = {
  id: string;
  message: {
    subject: string;
    createdAt: string;
    sender: { name?: string | null; firstName?: string; lastName?: string };
  };
};

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  author: { name?: string | null; firstName?: string; lastName?: string };
};

@Component({
  selector: 'app-home',
  imports: [
    Alert,
    Spinner,
    Card,
    CardBody,
    Button,
    RouterLink,
    DatePipe,
    PageHeader,
    StatCard,
    EmptyState,
    WelcomeBanner,
    RecentBroadcasts,
  ],
  template: `
    <!-- Welcome Banner for recently completed onboarding -->
    @if (showWelcomeBanner()) {
      <app-welcome-banner [summary]="onboardingSummary()" [firstVisit]="isFirstVisit()" />
    }

    <lib-page-header
      [title]="greeting()"
      [subtitle]="headerSubtitle()"
      actionLabel="Nuevo comunicado"
      actionIcon="campaign"
      (action)="newBroadcast()"
    />

    @if (attention.value()?.periodClose; as close) {
      <div uiAlert tone="info" class="mb-4">
        <span class="material-symbols-outlined" aria-hidden="true">event_upcoming</span>
        <span class="flex-1">
          <strong>{{
            close.daysLeft === 0
              ? 'Hoy cierra el ' + close.name
              : 'Cierre del ' + close.name + ' en ' + close.daysLeft + (close.daysLeft === 1 ? ' día' : ' días')
          }}</strong>
          · {{ close.coursesWithMissingGrades }} de {{ close.totalCourses }} cursos tienen calificaciones incompletas.
        </span>
        <a routerLink="/admin/courses" class="link font-medium">Ver cursos</a>
      </div>
    }

    <section uiCard aria-labelledby="admin-attention-title">
      <div uiCardBody>
        <h2 id="admin-attention-title" class="text-base font-semibold text-ink-strong">Requiere tu atención</h2>
        @if (attention.isLoading()) {
          <div class="flex justify-center py-6"><span uiSpinner></span></div>
        } @else if (attention.error()) {
          <div uiAlert tone="danger" role="alert" class="mt-2">
            <span>No se pudo cargar el resumen de la escuela.</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="attention.reload()">Reintentar</button>
          </div>
        } @else if (tiles().length === 0) {
          <lib-empty-state
            title="Todo al día"
            description="No hay solicitudes, aprobaciones ni pendientes de la escuela."
            icon="task_alt"
            color="success"
          />
        } @else {
          <ul class="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            @for (tile of tiles(); track tile.label) {
              <li>
                <a
                  [routerLink]="tile.link"
                  class="flex h-full flex-col gap-1.5 rounded-field border border-line p-3.5 text-ink hover:border-line-strong hover:no-underline"
                >
                  <span class="flex items-center gap-2">
                    <span
                      class="material-symbols-outlined flex size-9 items-center justify-center rounded-field"
                      [class]="tile.iconClass"
                      aria-hidden="true"
                      >{{ tile.icon }}</span
                    >
                    <strong class="text-2xl text-ink-strong">{{ tile.count }}</strong>
                  </span>
                  <span class="font-medium text-ink-strong">{{ tile.label }}</span>
                  <span class="text-xs text-ink-muted">{{ tile.detail }}</span>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </section>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card
        label="Estudiantes activos"
        [value]="studentsValue()"
        [helper]="studentsHelper()"
        icon="school"
        color="primary"
      />
      <lib-stat-card
        label="Asistencia hoy"
        [value]="attendanceValue()"
        [helper]="attendanceHelper()"
        icon="how_to_reg"
        color="success"
      />
      @if (kpis.value()?.collection !== null) {
        <lib-stat-card
          label="Cobranza del mes"
          [value]="collectionValue()"
          [helper]="collectionHelper()"
          icon="payments"
          color="info"
        />
      }
      <lib-stat-card
        label="Aprobando todas las materias"
        [value]="passingValue()"
        [helper]="passingHelper()"
        icon="grade"
        color="warning"
      />
    </div>

    <div class="mt-6">
      <app-recent-broadcasts />
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-3">
      <div uiCard class="lg:col-span-2">
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-ink-strong">Mensajes recientes</h2>
            <a uiButton variant="ghost" size="sm" routerLink="/messages" class="text-primary"> Ver todos </a>
          </div>
          @if ((recentMessages.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Las notificaciones nuevas aparecerán aquí."
              icon="mail"
              color="primary"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (message of recentMessages.value() ?? []; track message.id) {
                <div
                  class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2 cursor-pointer"
                >
                  <p class="font-medium text-ink-strong text-sm">
                    {{ message.message.subject }}
                  </p>
                  <div class="text-xs text-ink-muted mt-1">
                    {{ senderDisplayName(message.message.sender) }} ·
                    {{ message.message.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div uiCard>
        <div uiCardBody>
          <h2 class="text-base font-semibold text-ink-strong">Acciones rápidas</h2>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 mt-2">
            <a
              routerLink="/students"
              class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-primary">school</span>
              <div>
                <p class="font-medium text-sm text-ink-strong">Gestionar alumnos</p>
                <p class="text-xs text-ink-muted">Altas y seguimiento</p>
              </div>
            </a>
            <a
              routerLink="/teachers"
              class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-accent">groups</span>
              <div>
                <p class="font-medium text-sm text-ink-strong">Gestionar docentes</p>
                <p class="text-xs text-ink-muted">Equipo académico</p>
              </div>
            </a>
            <a
              routerLink="/admin/subjects"
              class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-info">library_books</span>
              <div>
                <p class="font-medium text-sm text-ink-strong">Asignaturas</p>
                <p class="text-xs text-ink-muted">Plan curricular</p>
              </div>
            </a>
            <a
              routerLink="/messages"
              class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2 flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-xl text-success">forum</span>
              <div>
                <p class="font-medium text-sm text-ink-strong">Mensajería</p>
                <p class="text-xs text-ink-muted">Comunicación interna</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    @if (!recentNewsletters.error()) {
      <div class="mt-5">
        <div uiCard>
          <div uiCardBody>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-ink-strong">Boletines recientes</h2>
              <a uiButton variant="ghost" size="sm" routerLink="/admin/newsletters" class="text-primary"> Ver todos </a>
            </div>
            @if ((recentNewsletters.value() ?? []).length === 0) {
              <lib-empty-state
                title="Sin boletines recientes"
                description="Los boletines publicados aparecerán aquí."
                icon="newspaper"
                color="info"
              />
            } @else {
              <div class="space-y-3">
                @for (newsletter of recentNewsletters.value() ?? []; track newsletter.id) {
                  <div class="rounded-lg border border-line p-4 transition-colors duration-150 hover:bg-surface-2">
                    <p class="font-medium text-ink-strong text-sm">{{ newsletter.title }}</p>
                    <p class="text-xs text-ink-muted mt-1 line-clamp-2">
                      {{ stripHtml(newsletter.content) }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs text-ink-muted">
                        {{ authorDisplayName(newsletter.author) }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-xs"> Ver más </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <div uiCard>
        <div uiCardBody>
          <h2 class="text-base font-semibold text-ink-strong">Últimos estudiantes</h2>
          @if ((recentStudents.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin estudiantes recientes"
              description="Las nuevas matrículas aparecerán aquí."
              icon="school"
              color="info"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (student of recentStudents.value() ?? []; track student.id) {
                <div class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2">
                  <p class="font-medium text-sm text-ink-strong">
                    {{ student.fullName }}
                  </p>
                  <div class="text-xs text-ink-muted mt-1">
                    {{ student.classGroup?.name ?? 'Sin grupo' }} ·
                    {{ student.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div uiCard>
        <div uiCardBody>
          <h2 class="text-base font-semibold text-ink-strong">Docentes recientes</h2>
          @if ((recentTeachers.value() ?? []).length === 0) {
            <lib-empty-state
              title="Sin docentes recientes"
              description="Nuevas contrataciones aparecerán aquí."
              icon="groups"
              color="accent"
            />
          } @else {
            <div class="space-y-2 mt-2">
              @for (teacher of recentTeachers.value() ?? []; track teacher.id) {
                <div class="rounded-lg border border-line p-3 transition-colors duration-150 hover:bg-surface-2">
                  <p class="font-medium text-sm text-ink-strong">
                    {{ teacher.fullName }}
                  </p>
                  <div class="text-xs text-ink-muted mt-1">
                    {{ teacher.user ? teacher.user.email : 'Sin correo' }} ·
                    {{ teacher.createdAt | date: 'short' }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export default class Home {
  private store = inject(Store);
  private FIRST_VISIT_KEY = 'skooltrak_first_visit_shown';

  senderDisplayName(sender: InboxRow['message']['sender']): string {
    if (sender.name?.trim()) return sender.name;
    return [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  authorDisplayName(author: PublishedNewsletter['author']): string {
    if (author.name?.trim()) return author.name;
    return [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  // Onboarding status query
  public onboardingStatus = httpResource<{
    onboardingCompleted: boolean;
    schoolName?: string | null;
    degreesCount: number;
    studyPlansCount: number;
    coursesCount: number;
    groupsCount: number;
  }>(() => '/api/v1/auth/onboarding-status');

  // Check if we should show the welcome banner
  public showWelcomeBanner = computed(() => {
    const status = this.onboardingStatus.value();
    if (!status?.onboardingCompleted) return false;
    // Show if onboarding was just completed or user hasn't dismissed
    return true;
  });

  public onboardingSummary = computed(() => {
    const status = this.onboardingStatus.value();
    return {
      schoolName: status?.schoolName ?? undefined,
      degreesCount: status?.degreesCount ?? 0,
      studyPlansCount: status?.studyPlansCount ?? 0,
      coursesCount: status?.coursesCount ?? 0,
      groupsCount: status?.groupsCount ?? 0,
    };
  });

  public isFirstVisit = computed(() => {
    if (typeof localStorage === 'undefined') return false;
    const shown = localStorage.getItem(this.FIRST_VISIT_KEY);
    if (!shown) {
      // Mark as shown for next time
      localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
      return true;
    }
    return false;
  });

  // ── HOM-001-S08: attention tiles, period banner, KPI row ─────────────────
  #router = inject(Router);

  public attention = httpResource<AdminAttention>(() => {
    const schoolId = this.store.currentSchoolId();
    return schoolId ? { url: '/api/v1/home/admin/attention', params: { schoolId } } : undefined;
  });

  public kpis = httpResource<AdminKpis>(() => {
    const schoolId = this.store.currentSchoolId();
    return schoolId ? { url: '/api/v1/home/admin/kpis', params: { schoolId } } : undefined;
  });

  public greeting = computed(() => {
    const a = this.attention.value();
    if (!a) return 'Panel administrativo';
    const hour = Number(a.time.slice(0, 2));
    const salutation = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return a.firstName ? `${salutation}, ${a.firstName}` : salutation;
  });

  public headerSubtitle = computed(() => {
    const a = this.attention.value();
    if (!a) return 'Resumen general de la institución.';
    const date = capitalize(longDate.format(new Date(`${a.date}T00:00:00Z`)));
    return [date, a.period?.name, a.school.name].filter(Boolean).join(' · ');
  });

  /** FR-HOM-001.24 tiles with a non-zero count. */
  public tiles = computed<AttentionTile[]>(() => {
    const a = this.attention.value();
    if (!a) return [];
    const t = a.tiles;
    const tiles: AttentionTile[] = [];
    if (t.joinRequests.total) {
      const parts = [
        t.joinRequests.teachers ? plural(t.joinRequests.teachers, 'docente', 'docentes') : '',
        t.joinRequests.parents ? plural(t.joinRequests.parents, 'acudiente', 'acudientes') : '',
        t.joinRequests.others ? plural(t.joinRequests.others, 'otro', 'otros') : '',
      ].filter(Boolean);
      const days = t.joinRequests.oldestAt
        ? Math.floor((Date.now() - new Date(t.joinRequests.oldestAt).getTime()) / 86_400_000)
        : null;
      if (days !== null && days > 0) parts.push(`la más antigua hace ${plural(days, 'día', 'días')}`);
      tiles.push({
        icon: 'how_to_reg',
        iconClass: 'bg-warning/15 text-warning',
        count: t.joinRequests.total,
        label: 'Solicitudes de ingreso',
        detail: parts.join(' · '),
        link: '/admin/join-requests',
      });
    }
    if (t.broadcastsToApprove) {
      tiles.push({
        icon: 'approval',
        iconClass: 'bg-primary/15 text-primary',
        count: t.broadcastsToApprove,
        label: 'Comunicados por aprobar',
        detail: 'Enviados a toda la escuela',
        link: '/communication',
      });
    }
    if (t.missedAttendance) {
      tiles.push({
        icon: 'fact_check',
        iconClass: 'bg-info/15 text-info',
        count: t.missedAttendance,
        label: 'Clases sin asistencia hoy',
        detail: 'Ya pasó su hora de inicio',
        link: '/admin/attendance-reporting',
      });
    }
    if (t.overdueCharges?.count) {
      const amount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: a.currencyCode }).format(
        t.overdueCharges.amount,
      );
      tiles.push({
        icon: 'receipt_long',
        iconClass: 'bg-error/15 text-error',
        count: t.overdueCharges.count,
        label: 'Cargos vencidos',
        detail: `${amount} sin cobrar · ${plural(t.overdueCharges.families, 'familia', 'familias')}`,
        link: '/financial-module',
      });
    }
    if (t.failedImports) {
      tiles.push({
        icon: 'upload_file',
        iconClass: 'bg-surface-2 text-ink',
        count: t.failedImports,
        label: t.failedImports === 1 ? 'Importación con errores' : 'Importaciones con errores',
        detail: 'Últimos 30 días',
        link: '/admin/imports',
      });
    }
    if (t.plansWithoutScale) {
      tiles.push({
        icon: 'rule',
        iconClass: 'bg-warning/15 text-warning',
        count: t.plansWithoutScale,
        label: 'Planes sin escala de notas',
        detail: 'Sin ella no se calcula la nota mínima',
        link: '/admin/study-plans',
      });
    }
    return tiles;
  });

  public studentsValue = computed(() =>
    this.kpis.isLoading() ? '…' : integer.format(this.kpis.value()?.students.active ?? 0),
  );
  public studentsHelper = computed(() => {
    const c = this.kpis.value()?.students.candidates ?? 0;
    return c ? `+${plural(c, 'candidato', 'candidatos')} por matricular` : 'Matriculados';
  });

  public attendanceValue = computed(() => {
    if (this.kpis.isLoading()) return '…';
    const rate = this.kpis.value()?.attendanceToday.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });
  public attendanceHelper = computed(() => {
    const a = this.kpis.value()?.attendanceToday;
    if (!a || a.rate === null) return 'Aún sin registros hoy';
    const parts = [plural(a.absent, 'ausente', 'ausentes'), plural(a.late, 'tardanza', 'tardanzas')];
    if (a.lastWeekRate !== null) parts.push(`semana pasada ${percent.format(a.lastWeekRate)}`);
    return parts.join(' · ');
  });

  public collectionValue = computed(() => {
    if (this.kpis.isLoading()) return '…';
    const rate = this.kpis.value()?.collection?.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });
  public collectionHelper = computed(() => {
    const k = this.kpis.value();
    const c = k?.collection;
    if (!k || !c) return '';
    if (!c.billed) return 'Sin cargos este mes';
    const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: k.currencyCode });
    return `${money.format(c.collected)} de ${money.format(c.billed)} facturado`;
  });

  public passingValue = computed(() => {
    if (this.kpis.isLoading()) return '…';
    const rate = this.kpis.value()?.passing?.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });
  public passingHelper = computed(() => {
    const p = this.kpis.value()?.passing;
    if (!p) return 'Sin periodo activo';
    if (!p.evaluated) return 'Sin calificaciones publicadas';
    return `${integer.format(p.belowPass)} bajo la nota mínima en al menos una materia · ${integer.format(p.allExcellent)} en excelencia`;
  });

  newBroadcast() {
    this.#router.navigate(['/communication']);
  }

  public recentMessages = httpResource<InboxRow[]>(() => ({
    url: '/api/v1/messages',
    params: toFetchQueryParams({ take: 5, skip: 0 }),
    defaultValue: [],
  }));

  public recentStudents = httpResource<RecentStudent[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/students`,
      params: toFetchQueryParams({
        take: 4,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        schoolId,
      }),
    };
  });

  public recentNewsletters = httpResource<PublishedNewsletter[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/newsletters/published`,
      params: { schoolId, take: '3' },
    };
  });

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }

  public recentTeachers = httpResource<RecentTeacher[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/teachers`,
      params: toFetchQueryParams({
        take: 4,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        schoolId,
      }),
    };
  });
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
