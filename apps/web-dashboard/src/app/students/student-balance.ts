import { Loader, PageHeader, StatCard, Toast } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';
import { isValidId } from '../core/validators';

type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

type ChargeView = {
  id: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  description: string;
  chargeType: string;
  status: ChargeStatus;
};

type PaymentView = {
  id: string;
  amount: number;
  paidAt: string;
  reference: string | null;
};

type StudentBalanceSummary = {
  studentId: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  totalOverdue: number;
  totalActive: number;
  totalPaid: number;
  charges: ChargeView[];
  payments: PaymentView[];
};

const STATUS_LABELS: Record<ChargeStatus, string> = {
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
};

const STATUS_CLASS: Record<ChargeStatus, string> = {
  PAID: 'badge-success',
  PARTIAL: 'badge-info',
  PENDING: 'badge-warning',
  OVERDUE: 'badge-error',
};

@Component({
  selector: 'app-student-balance',
  imports: [Loader, PageHeader, StatCard, DatePipe],
  template: `
    <lib-page-header
      title="Estado de cuenta"
      subtitle="Resumen de cargos, pagos y saldo."
      [actionLabel]="canRegenerate() ? 'Generar desde plan de estudios' : undefined"
      actionIcon="autorenew"
      (action)="regenerate(false)"
    />

    @if (summaryResource.isLoading()) {
      <div class="flex justify-center py-8">
        <lib-loader />
      </div>
    }

    @if (summaryResource.error()) {
      <div class="alert alert-error">No se pudo cargar el estado de cuenta.</div>
    }

    @if (summaryResource.hasValue() && !summaryResource.isLoading()) {
      @let summary = summaryResource.value()!;
      <div class="grid gap-4 md:grid-cols-4">
        <lib-stat-card
          label="Vencido"
          [value]="formatCurrency(summary.totalOverdue)"
          helper="Cargos vencidos"
          color="error"
        />
        <lib-stat-card
          label="Vigente"
          [value]="formatCurrency(summary.totalActive)"
          helper="Cargos pendientes"
          color="warning"
        />
        <lib-stat-card
          label="Pagado"
          [value]="formatCurrency(summary.totalPaid)"
          helper="Cargos liquidados"
          color="success"
        />
        <lib-stat-card
          label="Saldo"
          [value]="formatCurrency(summary.balance)"
          [helper]="summary.balance >= 0 ? 'Al día' : 'Pendiente'"
          [color]="summary.balance >= 0 ? 'success' : 'warning'"
        />
      </div>

      @let overdue = summary.charges.filter((c) => c.status === 'OVERDUE');
      @let active = summary.charges.filter((c) => c.status === 'PENDING' || c.status === 'PARTIAL');
      @let paid = summary.charges.filter((c) => c.status === 'PAID');
      @let sections = [
        { title: 'Cargos vencidos', charges: overdue, empty: 'Sin cargos vencidos' },
        { title: 'Cargos vigentes', charges: active, empty: 'Sin cargos pendientes' },
        { title: 'Cargos pagados', charges: paid, empty: 'Sin cargos pagados' },
      ];

      <div class="mt-6 grid gap-6">
        @for (section of sections; track section.title) {
          <div class="card border border-base-200 bg-base-100">
            <div class="card-body">
              <h2 class="text-lg font-semibold text-base-content">{{ section.title }}</h2>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Fecha límite</th>
                      <th>Monto</th>
                      <th>Pagado</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of section.charges; track c.id) {
                      <tr class="hover">
                        <td>{{ c.description }}</td>
                        <td>{{ c.dueDate | date: 'shortDate' }}</td>
                        <td>{{ formatCurrency(c.amount) }}</td>
                        <td>{{ c.paidAmount > 0 ? formatCurrency(c.paidAmount) : '-' }}</td>
                        <td>
                          <span class="badge badge-sm" [class]="statusClass(c.status)">
                            {{ statusLabel(c.status) }}
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="text-center py-6 text-base-content/60">{{ section.empty }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="mt-6 card border border-base-200 bg-base-100">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-base-content">Historial de pagos</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                @for (p of summary.payments; track p.id) {
                  <tr class="hover">
                    <td>{{ p.paidAt | date: 'mediumDate' }}</td>
                    <td>{{ formatCurrency(p.amount) }}</td>
                    <td class="text-base-content/70">{{ p.reference || '-' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="text-center py-6 text-base-content/60">No hay pagos registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  `,
})
export default class StudentBalance {
  public studentId = input.required<string>();

  #store = inject(Store);
  #auth = inject(Auth);
  #http = inject(HttpClient);
  toasts = inject(Toast);

  /** Only finance managers can backfill/recreate charges for a student. */
  public canRegenerate = computed(() => this.#auth.hasPermission('MANAGE_FINANCIALS'));

  public regenerating = signal(false);

  public summaryResource = httpResource<StudentBalanceSummary | null>(() => {
    const studentId = this.studentId();
    if (!isValidId(studentId)) return undefined;
    return { url: '/api/v1/financial/student-balance-summary', params: { studentId } };
  });

  public async regenerate(force: boolean) {
    const studentId = this.studentId();
    if (!isValidId(studentId)) return;
    if (!window.confirm('¿Generar los cargos del plan de estudios para este alumno?')) return;
    this.regenerating.set(true);
    try {
      const result = await firstValueFrom(
        this.#http.post<{ created: number }>('/api/v1/financial/charges/regenerate-from-study-plan', {
          studentId,
          force,
        }),
      );
      this.toasts.showSuccess(
        result.created > 0
          ? `Se generaron ${result.created} cargo(s) desde el plan de estudios`
          : 'No se generaron cargos nuevos (ya existen o el plan no tiene costos)',
      );
      this.summaryResource.reload();
    } catch {
      this.toasts.showError('No se pudieron generar los cargos');
    } finally {
      this.regenerating.set(false);
    }
  }

  formatCurrency(value: number): string {
    const code = this.#store.currentSchool()?.currencyCode ?? 'USD';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
    }).format(value);
  }

  statusLabel(status: ChargeStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: ChargeStatus): string {
    return STATUS_CLASS[status] ?? 'badge-ghost';
  }
}
