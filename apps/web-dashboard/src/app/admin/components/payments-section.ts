import { EmptyState, Pagination, Paginator, UiField, UiInput, UiSelect, UiTable } from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import Store from '../../core/store';
import Auth from '../../auth/auth';

type PaymentType = {
  id: string;
  amount: number;
  paidAt: string;
  reference?: string | null;
  student: { id: string; firstName: string; fatherName: string };
};

type StudentOption = { id: string; firstName: string; fatherName: string };

@Component({
  selector: 'app-payments-section',
  imports: [UiTable, UiInput, UiSelect, DatePipe, DecimalPipe, EmptyState, FormsModule, Paginator, UiField],
  providers: [Pagination],
  template: `
    <div class="bg-surface-1 rounded-lg border border-line">
      <div class="flex flex-wrap gap-2 items-end p-3 border-b border-line">
        @if (showStudentFilter()) {
          <ui-field label="Estudiante">
            <select uiSelect size="sm" [ngModel]="studentFilter()" (ngModelChange)="onStudentChange($event)">
              <option value="">Todos</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </ui-field>
        }
        <ui-field label="Referencia" class="grow min-w-48">
          <input
            uiInput
            size="sm"
            type="search"
            placeholder="Buscar referencia..."
            [ngModel]="pagination.search()"
            (ngModelChange)="pagination.updateSearch($event)"
          />
        </ui-field>
      </div>

      @if (paymentsResource.isLoading()) {
        <div class="p-8 text-center">Cargando...</div>
      } @else if (paymentsResource.value()?.data.length) {
        <table uiTable>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Monto</th>
              <th>Referencia</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            @for (p of paymentsResource.value()?.data ?? []; track p.id) {
              <tr>
                <td>{{ p.student.firstName }} {{ p.student.fatherName }}</td>
                <td>{{ p.amount | number: '1.2-2' }}</td>
                <td>{{ p.reference || '-' }}</td>
                <td>{{ p.paidAt | date: 'dd/MM/yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="p-4">
          <lib-paginator
            [take]="pagination.take()"
            [skip]="pagination.skip()"
            [count]="pagination.count()"
            (skipChange)="pagination.updateSkip($event)"
            (takeChange)="pagination.updateTake($event)"
          />
        </div>
      } @else {
        <div class="p-8">
          <lib-empty-state
            title="Sin pagos"
            description="No se encontraron pagos con los filtros aplicados."
            icon="payments"
          />
        </div>
      }
    </div>
  `,
})
export default class PaymentsSection {
  private store = inject(Store);
  private auth = inject(Auth);
  public pagination = inject(Pagination);

  public year = input<number>(new Date().getFullYear());
  public reloadToken = input<number>(0);

  public studentFilter = signal('');

  public isStudent = this.auth.isStudent;
  public showStudentFilter = computed(() => !this.isStudent());

  public students = httpResource<StudentOption[]>(() => {
    if (!this.showStudentFilter()) return undefined;
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: `/api/v1/students/by-school/${schoolId}` };
  });

  public paymentsResource = httpResource<{ data: PaymentType[]; total: number }>(
    () => {
      const year = this.year();
      const reload = this.reloadToken();
      const skip = this.pagination.skip();
      const take = this.pagination.take();
      const search = this.pagination.search();
      const studentId = this.studentFilter();

      if (this.isStudent()) {
        return {
          url: '/api/v1/financial/payments/student',
          params: toFetchQueryRecord({
            year,
            reference: search,
            skip,
            take,
            reloadToken: reload,
          }),
        };
      }

      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/financial/payments/by-school',
        params: toFetchQueryRecord({
          schoolId,
          year,
          studentId: studentId || undefined,
          reference: search,
          skip,
          take,
          reloadToken: reload,
        }),
      };
    },
    { defaultValue: { data: [], total: 0 } },
  );

  constructor() {
    this.pagination.updateTake(10);
    effect(() => {
      const value = this.paymentsResource.value();
      if (value) {
        this.pagination.updateCount(value.total);
      }
    });
  }

  public onStudentChange(value: string) {
    this.studentFilter.set(value);
    this.pagination.updateSkip(0);
  }
}
