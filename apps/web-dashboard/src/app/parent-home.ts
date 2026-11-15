import { Alert, Badge, Button, Card, CardBody, EmptyState, PageHeader, Spinner, StatCard } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Store from './core/store';
import { Thread } from './communication/communication-api.service';
import { LinkedChild, ParentContext } from './parent/parent-context.service';
import { RecentBroadcasts } from './communication/recent-broadcasts';

type PublishedNewsletter = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: { name: string };
};

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
};

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
  imports: [Alert, Badge, Button, Spinner, Card, CardBody, DatePipe, RouterLink, PageHeader, StatCard, EmptyState, RecentBroadcasts],
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
    }

    <div class="mt-6">
      <app-recent-broadcasts />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div uiCard>
        <div uiCardBody>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-base-content">Mensajes recientes</h2>
            <a routerLink="/parent/communication" class="link link-primary text-sm"> Ir a mensajes </a>
          </div>
          @if ((recentThreads().length ?? 0) === 0) {
            <lib-empty-state
              title="Sin mensajes recientes"
              description="Cuando un docente te escriba, el mensaje aparecerá aquí."
              icon="mail"
            />
          } @else {
            <div class="space-y-3">
              @for (thread of recentThreads(); track thread.id) {
                <a
                  routerLink="/parent/communication"
                  class="block rounded-lg border border-base-200 p-3 hover:border-primary transition-colors"
                >
                  <p class="font-medium text-base-content">
                    {{ thread.title }}
                  </p>
                  <p class="text-sm text-base-content/70 line-clamp-2">{{ thread.preview }}</p>
                  <div class="text-sm text-base-content/70 mt-1">
                    {{ thread.senderName }}
                    @if (thread.createdAt) {
                      · {{ thread.createdAt | date: 'short' }}
                    }
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </div>

      @if (!recentNewsletters.error()) {
        <div uiCard>
          <div uiCardBody>
            <h2 class="text-lg font-semibold text-base-content">Boletines recientes</h2>
            @if ((recentNewsletters.value() ?? []).length === 0) {
              <lib-empty-state
                title="Sin boletines recientes"
                description="Los boletines publicados aparecerán aquí."
                icon="newspaper"
              />
            } @else {
              <div class="space-y-3">
                @for (newsletter of recentNewsletters.value() ?? []; track newsletter.id) {
                  <div class="rounded-lg border border-base-200 p-3">
                    <p class="font-medium text-base-content">{{ newsletter.title }}</p>
                    <p class="text-sm text-base-content/70 mt-1 line-clamp-2">
                      {{ stripHtml(newsletter.content) }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-sm text-base-content/70">
                        {{ newsletter.author.name }} · {{ newsletter.publishedAt | date: 'mediumDate' }}
                      </span>
                      <a [routerLink]="['/newsletters', newsletter.id]" class="link link-primary text-sm"> Ver más </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export default class ParentHome {
  #store = inject(Store);
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

  private money(amount: number, currency: string) {
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

  // ── Pre-HOM sections, replaced in HOM-001-S07 ─────────────────────────────
  public recentMessages = httpResource<Thread[]>(() => '/api/v1/communication/threads', { defaultValue: [] });

  public recentThreads = computed(() => {
    return [...(this.recentMessages.value() ?? [])]
      .filter((t) => !t.broadcast)
      .sort((a, b) => {
        const aDate = a.messages?.[0]?.createdAt ?? a.updatedAt;
        const bDate = b.messages?.[0]?.createdAt ?? b.updatedAt;
        return aDate < bDate ? 1 : -1;
      })
      .slice(0, 4)
      .map((t) => {
        const last = t.messages?.[0];
        const sender = last?.sender;
        return {
          id: t.id,
          title: t.title,
          preview: last?.body ?? '',
          senderName: sender ? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim() : '',
          createdAt: last?.createdAt,
        };
      });
  });

  public recentNewsletters = httpResource<PublishedNewsletter[]>(
    () => {
      const schoolId = this.#store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/newsletters/published',
        params: { schoolId, take: '3' },
      };
    },
    { defaultValue: [] },
  );

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() ?? '';
  }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
