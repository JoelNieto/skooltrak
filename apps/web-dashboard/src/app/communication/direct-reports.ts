import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Icon,
  MessageBubble,
  PageHeader,
  Spinner,
  Toast,
  UiInput,
} from '#/ui';
import { DirectReport, DirectReview } from '@/shared';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from './channel-form';
import { CommunicationApi } from './communication-api';

const API = '/api/v1/communication';

/**
 * COM-003 FR .20, BR .14: the organization's reported direct conversations, for its admins. A reported
 * conversation opens read-only; every opening is logged and shown here. Admins resolve a report
 * with a note. Conversations nobody reported stay private to their two participants (BR .9).
 */
@Component({
  selector: 'app-direct-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    DatePipe,
    EmptyState,
    FormsModule,
    Icon,
    MessageBubble,
    PageHeader,
    RouterLink,
    Spinner,
    UiInput,
  ],
  template: `
    <lib-page-header
      [breadcrumbs]="[
        { label: 'Inicio', link: '/' },
        { label: 'Mensajes directos', link: '/communication/direct' },
        { label: 'Conversaciones reportadas' },
      ]"
      title="Conversaciones reportadas"
      subtitle="Solo lectura. Cada vez que abres una conversación reportada queda registrado."
    />

    <div class="grid gap-4 md:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <section uiCard aria-label="Reportes">
        <div uiCardBody class="p-0">
          @if (reports.isLoading() && !reports.hasValue()) {
            <div class="flex justify-center py-8"><span uiSpinner></span></div>
          } @else if (reports.error()) {
            <div uiAlert tone="danger" role="alert" class="m-3">
              <span>No se pudieron cargar los reportes.</span>
              <button uiButton variant="ghost" size="sm" type="button" (click)="reports.reload()">Reintentar</button>
            </div>
          } @else {
            <ul class="flex flex-col" aria-label="Reportes">
              @for (r of reports.hasValue() ? reports.value() : []; track r.id) {
                <li class="border-t border-line first:border-t-0">
                  <a
                    [routerLink]="['/communication/direct-reports', r.conversationId]"
                    class="block px-4 py-3 hover:bg-surface-2"
                    [class.bg-surface-2]="r.conversationId === id()"
                  >
                    <span class="flex items-center justify-between gap-2">
                      <span class="truncate font-medium text-ink-strong">{{ r.staff.name }} · {{ r.parent.name }}</span>
                      @if (r.resolvedAt) {
                        <span uiBadge size="sm">Resuelto</span>
                      } @else {
                        <span uiBadge tone="warning" size="sm">Abierto</span>
                      }
                    </span>
                    @if (r.student) {
                      <span class="block text-xs text-ink-muted">Sobre {{ r.student.name }}</span>
                    }
                    <span class="block truncate text-sm text-ink">{{ r.reason }}</span>
                    <span class="block text-xs text-ink-muted">
                      Reportó {{ r.reportedBy.name }} · {{ r.createdAt | date: 'short' }}
                    </span>
                  </a>
                </li>
              } @empty {
                <li class="p-4">
                  <lib-empty-state title="No hay conversaciones reportadas" icon="flag" />
                </li>
              }
            </ul>
          }
        </div>
      </section>

      <section uiCard aria-label="Conversación reportada">
        <div uiCardBody>
          @if (!id()) {
            <lib-empty-state
              title="Elige un reporte"
              description="La conversación se abre en solo lectura y el acceso queda registrado."
              icon="flag"
            />
          } @else if (review.isLoading() && !review.hasValue()) {
            <div class="flex justify-center py-8"><span uiSpinner></span></div>
          } @else if (review.error()) {
            <lib-empty-state
              title="Conversación no disponible"
              description="Solo se pueden revisar conversaciones con un reporte abierto."
              icon="circle-alert"
              color="warning"
            />
          } @else if (review.hasValue()) {
            @let c = review.value();
            <header class="mb-3">
              <h2 class="text-lg font-semibold text-ink-strong">{{ c.staff.name }} · {{ c.parent.name }}</h2>
              @if (c.student) {
                <p class="text-sm text-ink-muted">Sobre {{ c.student.name }}</p>
              }
            </header>
            <div uiAlert tone="info" class="mb-4">
              <ui-icon name="eye" />
              <span>Solo lectura: no puedes escribir en esta conversación. Este acceso quedó registrado.</span>
            </div>

            <section aria-label="Mensajes" class="mb-6 grid gap-2">
              @for (m of c.messages; track m.id) {
                <lib-message-bubble
                  [body]="m.body"
                  [senderName]="m.sender?.name ?? '—'"
                  [sentAt]="(m.createdAt | date: 'short') ?? ''"
                  [mine]="m.sender?.id === c.staff.id"
                />
              } @empty {
                <p class="text-sm text-ink-muted">Sin mensajes.</p>
              }
            </section>

            <section aria-labelledby="reports-title" class="mb-6">
              <h3 id="reports-title" class="mb-2 text-sm font-semibold text-ink-strong">Reportes</h3>
              <ul class="grid gap-3">
                @for (r of c.reports; track r.id) {
                  <li class="rounded-box border border-line p-3">
                    <p class="text-sm text-ink-strong">{{ r.reason }}</p>
                    <p class="text-xs text-ink-muted">{{ r.reportedBy.name }} · {{ r.createdAt | date: 'short' }}</p>
                    @if (r.resolvedAt) {
                      <p class="mt-2 text-sm text-ink">
                        <span uiBadge size="sm">Resuelto</span>
                        {{ r.resolution }} — {{ r.resolvedBy?.name }}, {{ r.resolvedAt | date: 'short' }}
                      </p>
                    } @else {
                      <form
                        class="mt-2 grid gap-2"
                        (submit)="resolve($event, r)"
                        [attr.aria-label]="'Resolver el reporte de ' + r.reportedBy.name"
                      >
                        <textarea
                          uiInput
                          rows="2"
                          [name]="'resolution-' + r.id"
                          aria-label="Cómo se resolvió"
                          placeholder="¿Cómo se resolvió?"
                          [ngModel]="resolutions()[r.id] ?? ''"
                          (ngModelChange)="setResolution(r.id, $event)"
                        ></textarea>
                        <div class="flex justify-end">
                          <button
                            uiButton
                            variant="primary"
                            size="sm"
                            type="submit"
                            [disabled]="!(resolutions()[r.id] ?? '').trim() || resolving() === r.id"
                          >
                            Resolver reporte
                          </button>
                        </div>
                      </form>
                    }
                  </li>
                }
              </ul>
            </section>

            <section aria-labelledby="access-title">
              <h3 id="access-title" class="mb-2 text-sm font-semibold text-ink-strong">Accesos registrados</h3>
              <ul class="grid gap-1 text-sm text-ink-muted">
                @for (a of c.accesses; track $index) {
                  <li>{{ a.admin.name }} · {{ a.accessedAt | date: 'short' }}</li>
                }
              </ul>
            </section>
          }
        </div>
      </section>
    </div>
  `,
})
export default class DirectReports {
  #api = inject(CommunicationApi);
  #toast = inject(Toast);

  /** Route param: the reported conversation open on the right. */
  readonly id = input<string>();
  readonly reports = httpResource<DirectReport[]>(() => `${API}/direct/reports`);
  /** BR .14: opening it is logged by the API. */
  readonly review = httpResource<DirectReview>(() => {
    const id = this.id();
    return id ? `${API}/direct/reports/conversations/${id}` : undefined;
  });
  readonly resolutions = signal<Record<string, string>>({});
  readonly resolving = signal<string | null>(null);

  setResolution(reportId: string, value: string) {
    this.resolutions.update((r) => ({ ...r, [reportId]: value }));
  }

  async resolve(event: Event, report: DirectReport) {
    event.preventDefault();
    const resolution = (this.resolutions()[report.id] ?? '').trim();
    if (!resolution) return;
    this.resolving.set(report.id);
    try {
      await this.#api.resolveDirectReport(report.id, resolution);
      this.#toast.showSuccess('Reporte resuelto');
      this.reports.reload();
      this.review.reload();
    } catch (e) {
      this.#toast.showError(errorMessage(e));
    } finally {
      this.resolving.set(null);
    }
  }
}
