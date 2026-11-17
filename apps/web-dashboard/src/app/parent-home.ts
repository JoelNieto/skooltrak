import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardBody,
  ChartPlaceholder,
  EmptyState,
  PageHeader,
  Spinner,
  StatCard,
  TimeAgoPipe,
} from '#/ui';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LinkedChild, ParentContext } from './parent/parent-context.service';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type Ref = { id: string; name: string };

/** `GET /api/v1/home/parent/children` (HOM-001 FR .18). */
type ParentChild = {
  studentId: string;
  name: string;
  organizationId: string;
  classGroup: Ref | null;
  school: Ref;
  alertCount: number;
};
type ParentChildren = { firstName: string; defaultStudentId: string | null; children: ParentChild[] };

type AlertKind = 'ABSENCE' | 'OVERDUE_WORK' | 'BELOW_PASS' | 'CHARGE_OVERDUE' | 'CHARGE_DUE_SOON' | 'LATE';

/** `GET /api/v1/home/parent/child/:studentId` (HOM-001 FR .19 .20). */
type ParentChildHome = {
  student: { id: string; name: string; firstName: string; classGroup: Ref | null; school: Ref };
  currencyCode: string;
  alerts: { kind: AlertKind; tone: 'danger' | 'warning'; title: string; detail: string; action: { label: string; link: string } }[];
  kpis: {
    average: { value: number | null; max: number | null; delta: number | null; previousPeriodName: string | null };
    attendance: { rate: number | null; absences: number; late: number } | null;
    pending: { total: number; overdue: number };
    balance: { amount: number; overdue: number } | null;
  };
  work: WorkItem[];
  recentGrades: { id: string; title: string; course: Ref; score: number; band: GradeBand | null; date: string }[];
  messages: { id: string; title: string; senderName: string; lastMessageAt: string; preview: string; unread: boolean }[];
};

type AssignmentType = 'HOMEWORK' | 'EXAM' | 'QUIZ' | 'PROJECT' | 'PAPER' | 'NEW';
type WorkStatus = 'PENDIENTE' | 'ENTREGADO' | 'VENCIDA' | 'PRESENCIAL';
type GradeBand = 'EXCELLENT' | 'PASSING' | 'BELOW';
type WorkItem = { assignmentId: string; title: string; type: AssignmentType; course: Ref; dueAt: string; status: WorkStatus };

/** `GET /api/v1/home/parent/child/:studentId/account` (HOM-001 FR .22). */
type ParentAccount = {
  currencyCode: string;
  status: 'AL_DIA' | 'PENDIENTE' | 'VENCIDO';
  balance: number;
  overdue: number;
  nextCharge: { description: string; outstanding: number; dueDate: string } | null;
  lastPayment: { amount: number; paidAt: string } | null;
};

const ASSIGNMENT_TYPES: Record<AssignmentType, { label: string; tone: BadgeTone }> = {
  NEW: { label: 'Nuevo', tone: 'neutral' },
  HOMEWORK: { label: 'Tarea', tone: 'info' },
  EXAM: { label: 'Examen', tone: 'warning' },
  PROJECT: { label: 'Proyecto', tone: 'action' },
  QUIZ: { label: 'Quiz', tone: 'neutral' },
  PAPER: { label: 'Ensayo', tone: 'success' },
};
const WORK_STATUS: Record<WorkStatus, { label: string; tone: BadgeTone }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  ENTREGADO: { label: 'Entregado', tone: 'success' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
  PRESENCIAL: { label: 'Presencial', tone: 'neutral' },
};
const BAND_BADGE: Record<GradeBand, BadgeTone> = { EXCELLENT: 'success', PASSING: 'action', BELOW: 'danger' };
const ACCOUNT_STATUS: Record<ParentAccount['status'], { label: string; tone: BadgeTone }> = {
  AL_DIA: { label: 'Al día', tone: 'success' },
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  VENCIDO: { label: 'Vencido', tone: 'danger' },
};
const shortDate = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthName = new Intl.DateTimeFormat('es', { month: 'long', timeZone: 'UTC' });

const ALERT_ICONS: Record<AlertKind, string> = {
  ABSENCE: 'event_busy',
  OVERDUE_WORK: 'assignment_late',
  BELOW_PASS: 'trending_down',
  CHARGE_OVERDUE: 'payments',
  CHARGE_DUE_SOON: 'payments',
  LATE: 'schedule',
};

const percent = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 });
const grade = (n: number) => n.toFixed(1);

@Component({
  selector: 'app-parent-home',
  imports: [
    Alert,
    Badge,
    Button,
    Spinner,
    Card,
    CardBody,
    ChartPlaceholder,
    RouterLink,
    PageHeader,
    StatCard,
    EmptyState,
    RecentBroadcasts,
    TimeAgoPipe,
  ],
  template: `
    <lib-page-header
      [title]="greeting()"
      subtitle="Esto es lo que necesitas saber de tus hijos hoy."
      actionLabel="Escribir a un docente"
      actionIcon="edit_square"
      (action)="writeToTeacher()"
    />

    @if (childrenRes.isLoading()) {
      <div class="flex justify-center py-8"><span uiSpinner></span></div>
    } @else if (childrenRes.error()) {
      <div uiAlert tone="danger" role="alert">
        <span>No se pudieron cargar tus hijos.</span>
        <button uiButton variant="ghost" size="sm" type="button" (click)="childrenRes.reload()">Reintentar</button>
      </div>
    } @else if (children().length === 0) {
      <div uiCard>
        <div uiCardBody>
          <lib-empty-state
            title="Sin hijos vinculados"
            description="Vincula a tus hijos con su código de matrícula para ver su progreso."
            icon="group"
            actionLabel="Vincular hijo"
            (action)="linkChild()"
          />
        </div>
      </div>
    } @else {
      <div role="group" aria-label="Elegir hijo" class="flex flex-wrap gap-3">
        @for (child of children(); track child.studentId) {
          <button
            type="button"
            class="flex min-h-14 cursor-pointer items-center gap-3 rounded-box border-2 bg-surface-1 py-2 pl-2 pr-4 text-left"
            [class]="child.studentId === selectedId() ? 'border-primary' : 'border-line hover:border-line-strong'"
            [attr.aria-pressed]="child.studentId === selectedId()"
            (click)="select(child)"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-full font-semibold"
              [class]="child.studentId === selectedId() ? 'bg-primary text-primary-content' : 'bg-surface-2 text-ink'"
              aria-hidden="true"
              >{{ initials(child.name) }}</span
            >
            <span class="flex flex-col">
              <span class="font-semibold text-ink-strong">{{ child.name }}</span>
              <span class="text-xs text-ink-muted">{{ child.classGroup?.name ?? 'Sin grupo' }} · {{ child.school.name }}</span>
            </span>
            @if (child.alertCount > 0) {
              <span uiBadge tone="danger" size="sm">{{ child.alertCount === 1 ? '1 alerta' : child.alertCount + ' alertas' }}</span>
            }
          </button>
        }
      </div>

      <section uiCard class="mt-6" aria-labelledby="alerts-title">
        <div uiCardBody>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 id="alerts-title" class="text-base font-semibold text-ink-strong">
              Requiere tu atención{{ home.value() ? ' · ' + home.value()?.student?.firstName : '' }}
            </h2>
            <a routerLink="/parent/progress" class="link link-primary text-sm" (click)="rememberSelection()">Ver progreso</a>
          </div>
          @if (home.isLoading()) {
            <div class="flex justify-center py-8"><span uiSpinner></span></div>
          } @else if (home.error()) {
            <div uiAlert tone="danger" role="alert" class="mt-2">
              <span>No se pudo cargar la información de tu hijo.</span>
              <button uiButton variant="ghost" size="sm" type="button" (click)="home.reload()">Reintentar</button>
            </div>
          } @else if (alerts().length === 0) {
            <lib-empty-state title="Todo al día" description="No hay ausencias, tareas vencidas, notas bajas ni pagos pendientes." icon="task_alt" color="success" />
          } @else {
            <ul class="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              @for (alert of alerts(); track alert.kind + alert.title) {
                <li class="flex gap-3 rounded-field border border-line p-3.5">
                  <span
                    class="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-field"
                    [class]="alert.tone === 'danger' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning'"
                    aria-hidden="true"
                    >{{ alertIcon(alert.kind) }}</span
                  >
                  <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong class="text-ink-strong">{{ alert.title }}</strong>
                    <span class="text-sm text-ink-muted">{{ alert.detail }}</span>
                    <a [routerLink]="alert.action.link" class="link link-primary mt-1 text-sm font-medium" (click)="rememberSelection()">{{
                      alert.action.label
                    }}</a>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </section>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <lib-stat-card label="Promedio del periodo" [value]="averageValue()" [helper]="averageHelper()" icon="grade" color="primary" />
        <lib-stat-card label="Asistencia" [value]="attendanceValue()" [helper]="attendanceHelper()" icon="how_to_reg" color="success" />
        <lib-stat-card label="Entregas pendientes" [value]="pendingValue()" [helper]="pendingHelper()" icon="assignment" color="warning" />
        @if (home.value()?.kpis?.balance !== null) {
          <lib-stat-card label="Saldo" [value]="balanceValue()" [helper]="balanceHelper()" icon="account_balance_wallet" color="info" />
        }
      </div>

      @if (home.value(); as child) {
        <div class="mt-6 flex flex-wrap gap-6">
          <section uiCard class="min-w-0 flex-[999_1_560px]" aria-labelledby="work-title">
            <div uiCardBody>
              <div class="flex items-center justify-between">
                <h2 id="work-title" class="text-base font-semibold text-ink-strong">Próximas tareas y evaluaciones</h2>
                <a routerLink="/parent/progress" class="link link-primary text-sm" (click)="rememberSelection()">Ver progreso</a>
              </div>
              @if (child.work.length === 0) {
                <lib-empty-state title="Sin entregas próximas" description="Las tareas y evaluaciones de las próximas dos semanas aparecerán aquí." icon="assignment" />
              } @else {
                <ul class="mt-1 flex flex-col">
                  @for (item of child.work; track item.assignmentId) {
                    <li class="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-2.5 first:border-t-0">
                      <div class="min-w-56 flex-[1_1_240px]">
                        <p class="flex flex-wrap items-center gap-2">
                          <span uiBadge [tone]="typeOf(item).tone" size="sm">{{ typeOf(item).label }}</span>
                          <span class="font-medium text-ink-strong">{{ item.title }}</span>
                        </p>
                        <p class="mt-0.5 text-xs text-ink-muted">{{ item.course.name }} · {{ dueLabel(item) }}</p>
                      </div>
                      <span uiBadge [tone]="statusOf(item).tone">{{ statusOf(item).label }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>

          <section uiCard class="min-w-0 flex-[1_1_340px]" aria-labelledby="grades-title">
            <div uiCardBody>
              <h2 id="grades-title" class="text-base font-semibold text-ink-strong">Calificaciones recientes</h2>
              @if (child.recentGrades.length === 0) {
                <lib-empty-state title="Sin calificaciones publicadas" description="Las notas que publiquen sus docentes aparecerán aquí." icon="grade" />
              } @else {
                <ul class="mt-1 flex flex-col">
                  @for (g of child.recentGrades; track g.id) {
                    <li class="flex min-h-11 items-center gap-3 border-t border-line py-2 first:border-t-0">
                      <span class="min-w-0 flex-1">
                        <span class="block font-medium text-ink-strong">{{ g.course.name }}</span>
                        <span class="block text-xs text-ink-muted">{{ g.title }} · {{ gradeDate(g.date) }}</span>
                      </span>
                      <span uiBadge [tone]="g.band ? bandBadge[g.band] : 'neutral'">{{ gradeText(g.score) }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>
        </div>

        <div class="mt-6 flex flex-wrap gap-6">
          <section uiCard class="min-w-0 flex-[999_1_560px]" aria-labelledby="attendance-title">
            <div uiCardBody>
              <h2 id="attendance-title" class="text-base font-semibold text-ink-strong">Asistencia de {{ currentMonth() }}</h2>
              <ui-chart-placeholder
                class="mt-2"
                kind="Calendario de calor"
                description="Un día por celda, coloreado por estado (presente, tarde, ausente, excusa); toca un día para ver cada clase"
                source="attendance_records"
              />
            </div>
          </section>

          @if (child.kpis.balance !== null) {
            <section uiCard class="min-w-0 flex-[1_1_340px]" aria-labelledby="account-title">
              <div uiCardBody>
                <div class="flex items-center justify-between">
                  <h2 id="account-title" class="text-base font-semibold text-ink-strong">Estado de cuenta</h2>
                  @if (account.value(); as acc) {
                    <span uiBadge [tone]="accountStatus(acc).tone">{{ accountStatus(acc).label }}</span>
                  }
                </div>
                @if (account.isLoading()) {
                  <div class="flex justify-center py-6"><span uiSpinner></span></div>
                } @else if (account.error()) {
                  <div uiAlert tone="danger" role="alert" class="mt-2">
                    <span>No se pudo cargar el estado de cuenta.</span>
                    <button uiButton variant="ghost" size="sm" type="button" (click)="account.reload()">Reintentar</button>
                  </div>
                } @else if (account.value(); as acc) {
                  <dl class="mt-1 flex flex-col">
                    <div class="flex min-h-11 items-center justify-between gap-3 border-b border-line py-2">
                      <dt class="text-ink-muted">Próximo cargo</dt>
                      <dd class="text-right">
                        @if (acc.nextCharge) {
                          <strong class="block text-ink-strong">{{ money(acc.nextCharge.outstanding, acc.currencyCode) }}</strong>
                          <span class="block text-xs text-ink-muted">{{ acc.nextCharge.description || 'Cargo' }} · vence {{ chargeDate(acc.nextCharge.dueDate) }}</span>
                        } @else {
                          <span class="text-ink-muted">Sin cargos pendientes</span>
                        }
                      </dd>
                    </div>
                    <div class="flex min-h-11 items-center justify-between gap-3 py-2">
                      <dt class="text-ink-muted">Último pago</dt>
                      <dd class="text-right">
                        @if (acc.lastPayment) {
                          <strong class="block text-ink-strong">{{ money(acc.lastPayment.amount, acc.currencyCode) }}</strong>
                          <span class="block text-xs text-ink-muted">{{ chargeDate(acc.lastPayment.paidAt) }}</span>
                        } @else {
                          <span class="text-ink-muted">Sin pagos registrados</span>
                        }
                      </dd>
                    </div>
                  </dl>
                  <a uiButton variant="secondary" routerLink="/parent/finances" class="mt-2 w-full" (click)="rememberSelection()">Ver estado de cuenta</a>
                }
              </div>
            </section>
          }
        </div>

        <div class="mt-6 flex flex-wrap gap-6">
          <section uiCard class="min-w-0 flex-[999_1_560px]" aria-labelledby="teacher-messages-title">
            <div uiCardBody>
              <div class="flex items-center justify-between">
                <h2 id="teacher-messages-title" class="text-base font-semibold text-ink-strong">Mensajes de docentes</h2>
                <a routerLink="/parent/communication" class="link link-primary text-sm" (click)="rememberSelection()">Ir a mensajes</a>
              </div>
              @if (child.messages.length === 0) {
                <lib-empty-state title="Sin mensajes" description="Cuando un docente te escriba sobre {{ child.student.firstName }}, el mensaje aparecerá aquí." icon="mail" />
              } @else {
                <ul class="mt-1 flex flex-col">
                  @for (m of child.messages; track m.id) {
                    <li class="border-t border-line first:border-t-0">
                      <a routerLink="/parent/communication" class="flex min-h-11 items-start gap-3 py-2.5 text-ink hover:no-underline" (click)="rememberSelection()">
                        <span
                          class="mt-1.5 size-2 shrink-0 rounded-full"
                          [class]="m.unread ? 'bg-primary' : 'bg-transparent'"
                          [attr.aria-label]="m.unread ? 'Sin leer' : null"
                          [attr.role]="m.unread ? 'img' : null"
                        ></span>
                        <span class="min-w-0 flex-1">
                          <span class="flex flex-wrap items-center gap-x-2">
                            <span class="font-medium text-ink-strong">{{ m.senderName }}</span>
                            <span class="text-xs text-ink-muted">{{ m.lastMessageAt | timeAgo }}</span>
                          </span>
                          <span class="block truncate text-xs text-ink-muted">{{ m.title }}</span>
                          <span class="line-clamp-2 text-sm text-ink">{{ m.preview }}</span>
                        </span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>

          <div class="min-w-0 flex-[1_1_340px]">
            <app-recent-broadcasts />
          </div>
        </div>

        <section uiCard class="mt-6" aria-labelledby="trend-title">
          <div uiCardBody>
            <h2 id="trend-title" class="text-base font-semibold text-ink-strong">Evolución de {{ child.student.firstName }}</h2>
            <ui-chart-placeholder
              class="mt-2 h-56"
              shape="line"
              kind="Línea"
              description="Promedio por periodo del estudiante frente a su grupo, con las bandas de aprobación y excelencia de su plan de estudio"
              source="grade-report / grade_metrics"
            />
          </div>
        </section>
      }
    }
  `,
})
export default class ParentHome {
  #ctx = inject(ParentContext);
  #router = inject(Router);

  // ── HOM-001-S06: child switcher, alerts and KPIs of the selected child ───
  public childrenRes = httpResource<ParentChildren>(() => '/api/v1/home/parent/children');
  public children = computed(() => this.childrenRes.value()?.children ?? []);

  /** The context's child while it is still linked, else the default (most alerts, BR-HOM-001.9). */
  public selectedId = computed(() => {
    const list = this.children();
    const chosen = this.#ctx.selectedChild()?.studentId;
    if (chosen && list.some((c) => c.studentId === chosen)) return chosen;
    return this.childrenRes.value()?.defaultStudentId ?? list[0]?.studentId ?? null;
  });

  public home = httpResource<ParentChildHome>(() => {
    const id = this.selectedId();
    return id ? `/api/v1/home/parent/child/${id}` : undefined;
  });

  public alerts = computed(() => this.home.value()?.alerts ?? []);

  public greeting = computed(() => {
    const name = this.childrenRes.value()?.firstName;
    return name ? `Hola, ${name}` : 'Hola';
  });

  public averageValue = computed(() => {
    if (this.home.isLoading()) return '…';
    const avg = this.home.value()?.kpis.average;
    if (!avg || avg.value === null) return '—';
    return avg.max !== null ? `${grade(avg.value)} / ${grade(avg.max)}` : grade(avg.value);
  });

  public averageHelper = computed(() => {
    if (this.home.error()) return 'No se pudo cargar';
    const avg = this.home.value()?.kpis.average;
    if (!avg || avg.delta === null || !avg.previousPeriodName) return 'Este periodo';
    if (avg.delta === 0) return `Igual que en ${avg.previousPeriodName}`;
    return `${avg.delta > 0 ? '+' : '−'}${grade(Math.abs(avg.delta))} vs ${avg.previousPeriodName}`;
  });

  public attendanceValue = computed(() => {
    if (this.home.isLoading()) return '…';
    const rate = this.home.value()?.kpis.attendance?.rate;
    return rate === null || rate === undefined ? '—' : percent.format(rate);
  });

  public attendanceHelper = computed(() => {
    const a = this.home.value()?.kpis.attendance;
    if (!a) return 'Sin periodo activo';
    return `${plural(a.absences, 'ausencia', 'ausencias')} · ${plural(a.late, 'tardanza', 'tardanzas')}`;
  });

  public pendingValue = computed(() => (this.home.isLoading() ? '…' : String(this.home.value()?.kpis.pending.total ?? '—')));

  public pendingHelper = computed(() => {
    const p = this.home.value()?.kpis.pending;
    if (!p || p.total === 0) return 'Nada pendiente';
    return p.overdue > 0 ? plural(p.overdue, 'vencida', 'vencidas') : 'Próximas dos semanas';
  });

  public balanceValue = computed(() => {
    const home = this.home.value();
    if (this.home.isLoading()) return '…';
    if (!home?.kpis.balance) return '—';
    return this.money(home.kpis.balance.amount, home.currencyCode);
  });

  public balanceHelper = computed(() => {
    const home = this.home.value();
    const b = home?.kpis.balance;
    if (!home || !b) return '';
    if (b.overdue > 0) return `${this.money(b.overdue, home.currencyCode)} vencido`;
    return b.amount > 0 ? 'Sin pagos vencidos' : 'Al día con los pagos';
  });

  select(child: ParentChild) {
    this.#ctx.select(this.toLinked(child));
  }

  /** Downstream parent pages read the child from ParentContext. */
  rememberSelection() {
    const child = this.children().find((c) => c.studentId === this.selectedId());
    if (child) this.#ctx.select(this.toLinked(child));
  }

  writeToTeacher() {
    this.rememberSelection();
    this.#router.navigate(['/parent/communication']);
  }

  linkChild() {
    this.#router.navigate(['/parent/portal']);
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  alertIcon(kind: AlertKind): string {
    return ALERT_ICONS[kind];
  }

  money(amount: number, currency: string) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  }

  private toLinked(child: ParentChild): LinkedChild {
    return {
      studentId: child.studentId,
      name: child.name,
      schoolId: child.school.id,
      schoolName: child.school.name,
      organizationId: child.organizationId,
      classGroupName: child.classGroup?.name ?? null,
    };
  }

  // ── HOM-001-S07: work, grades, teacher messages, account ─────────────────
  /** Only fetched when the child home includes a balance, i.e. the parent may see finances (BR-HOM-001.16). */
  public account = httpResource<ParentAccount>(() => {
    const id = this.selectedId();
    const balance = this.home.value()?.kpis.balance;
    return id && balance !== undefined && balance !== null ? `/api/v1/home/parent/child/${id}/account` : undefined;
  });

  protected readonly bandBadge = BAND_BADGE;
  public currentMonth = computed(() => monthName.format(new Date()));

  typeOf(item: WorkItem) {
    return ASSIGNMENT_TYPES[item.type] ?? ASSIGNMENT_TYPES.NEW;
  }

  statusOf(item: WorkItem) {
    return WORK_STATUS[item.status];
  }

  accountStatus(acc: ParentAccount) {
    return ACCOUNT_STATUS[acc.status];
  }

  dueLabel(item: WorkItem): string {
    const when = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(item.dueAt));
    return item.status === 'VENCIDA' ? `venció ${when}` : `vence ${when}`;
  }

  gradeDate(iso: string): string {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(iso));
  }

  /** `YYYY-MM-DD` calendar dates (charges, payments). */
  chargeDate(date: string): string {
    return shortDate.format(new Date(`${date}T00:00:00Z`));
  }

  gradeText(n: number): string {
    return grade(n);
  }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
