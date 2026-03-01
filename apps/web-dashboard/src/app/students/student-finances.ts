import { Loader, PageHeader, StatCard } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { isValidId } from '../core/validators';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';

type StudentBalanceType = {
  studentId: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

type ChargeType = {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  chargeType: string;
  status: string;
};

type PaymentType = {
  id: string;
  amount: number;
  paidAt: string;
  reference: string | null;
};

@Component({
  selector: 'app-student-finances',
  imports: [Loader, PageHeader, StatCard, DatePipe],
  template: `
    <lib-page-header
      title="Estado de cuenta"
      subtitle="Resumen de cargos, pagos y saldo."
    />

    @if (balanceResource.isLoading()) {
      <div class="flex justify-center py-8">
        <lib-loader />
      </div>
    }

    @if (balanceResource.hasValue()) {
      @let bal = balanceResource.value()!;
      <div class="grid gap-4 md:grid-cols-3">
        <lib-stat-card
          label="Total cargos"
          [value]="formatCurrency(bal.totalCharges)"
          helper="Cargos registrados"
        />
        <lib-stat-card
          label="Total pagos"
          [value]="formatCurrency(bal.totalPayments)"
          helper="Pagos realizados"
        />
        <lib-stat-card
          label="Saldo"
          [value]="formatCurrency(bal.balance)"
          [helper]="bal.balance >= 0 ? 'Al día' : 'Pendiente'"
          [color]="bal.balance >= 0 ? 'success' : 'warning'"
        />
      </div>
    }

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-base-content">Cargos</h2>

          @if (chargesResource.isLoading()) {
            <lib-loader />
          }

          @if (chargesResource.hasValue()) {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Fecha límite</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of chargesResource.value(); track c.id) {
                    <tr class="hover">
                      <td>{{ c.description }}</td>
                      <td>{{ c.dueDate | date: 'shortDate' }}</td>
                      <td>{{ formatCurrency(c.amount) }}</td>
                      <td>
                        <span class="badge badge-sm" [class.badge-success]="c.status === 'PAID'" [class.badge-warning]="c.status === 'PENDING'" [class.badge-error]="c.status === 'OVERDUE'">
                          {{ c.status === 'PAID' ? 'Pagado' : c.status === 'PENDING' ? 'Pendiente' : c.status === 'OVERDUE' ? 'Vencido' : c.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="text-center py-6 text-base-content/60">
                        No hay cargos
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <div class="card border border-base-200 bg-base-100">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-base-content">Historial de pagos</h2>

          @if (paymentsResource.isLoading()) {
            <lib-loader />
          }

          @if (paymentsResource.hasValue()) {
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
                  @for (p of paymentsResource.value(); track p.id) {
                    <tr class="hover">
                      <td>{{ p.paidAt | date: 'mediumDate' }}</td>
                      <td>{{ formatCurrency(p.amount) }}</td>
                      <td class="text-base-content/70">{{ p.reference || '-' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="3" class="text-center py-6 text-base-content/60">
                        No hay pagos registrados
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentFinances {
  #apollo = inject(Apollo);
  #store = inject(Store);

  public balanceResource = rxResource({
    params: () => ({
      studentId: this.#store.currentStudentId(),
    }),
    stream: ({ params }) => {
      if (!isValidId(params.studentId)) return of(null);
      return this.#apollo
        .query<{ studentBalance: StudentBalanceType }>({
          query: gql`
            query StudentBalance($studentId: String!) {
              studentBalance(studentId: $studentId) {
                studentId
                totalCharges
                totalPayments
                balance
              }
            }
          `,
          variables: { studentId: params.studentId },
        })
        .pipe(map((r) => r.data?.studentBalance));
    },
  });

  public chargesResource = rxResource({
    params: () => ({
      studentId: this.#store.currentStudentId(),
    }),
    stream: ({ params }) => {
      if (!isValidId(params.studentId)) return of([]);
      return this.#apollo
        .query<{ chargesByStudent: ChargeType[] }>({
          query: gql`
            query ChargesByStudent($studentId: String!) {
              chargesByStudent(studentId: $studentId) {
                id
                amount
                dueDate
                description
                chargeType
                status
              }
            }
          `,
          variables: { studentId: params.studentId },
        })
        .pipe(map((r) => r.data?.chargesByStudent ?? []));
    },
  });

  public paymentsResource = rxResource({
    params: () => ({
      studentId: this.#store.currentStudentId(),
    }),
    stream: ({ params }) => {
      if (!isValidId(params.studentId)) return of([]);
      return this.#apollo
        .query<{ paymentsByStudent: PaymentType[] }>({
          query: gql`
            query PaymentsByStudent($studentId: String!) {
              paymentsByStudent(studentId: $studentId) {
                id
                amount
                paidAt
                reference
              }
            }
          `,
          variables: { studentId: params.studentId },
        })
        .pipe(map((r) => r.data?.paymentsByStudent ?? []));
    },
  });

  formatCurrency(value: number): string {
    const code = this.#store.currentSchool()?.currencyCode ?? 'USD';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
    }).format(value);
  }
}
