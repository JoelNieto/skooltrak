import {
  Button,
  Card,
  Icon,
  listState,
  Pagination,
  Paginator,
  UiField,
  UiFilterChip,
  UiFilterMenu,
  UiInputGroup,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
} from '#/ui';
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
  imports: [
    Button,
    Card,
    Icon,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
    UiFilterMenu,
    UiFilterChip,
    UiInputGroup,
    UiSelect,
    DatePipe,
    DecimalPipe,
    FormsModule,
    Paginator,
    UiField,
  ],
  providers: [Pagination],
  template: `
    <ui-table-toolbar label="Filtrar pagos">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input
          aria-label="Buscar referencia"
          class="pl-0"
          type="search"
          placeholder="Buscar referencia..."
          [ngModel]="pagination.search()"
          (ngModelChange)="pagination.updateSearch($event)"
        />
      </label>
      @if (showStudentFilter()) {
        <ui-filter-menu [activeCount]="studentFilter() ? 1 : 0" (clear)="onStudentChange('')">
          <ui-field label="Estudiante">
            <select uiSelect [ngModel]="studentFilter()" (ngModelChange)="onStudentChange($event)">
              <option value="">Todos</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </ui-field>
        </ui-filter-menu>
      }
      @if (studentFilter()) {
        <ng-container uiToolbarChips>
          <ui-filter-chip [label]="'Estudiante: ' + selectedStudentName()" (remove)="onStudentChange('')" />
        </ng-container>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="paymentsResource.isLoading()">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Monto</th>
            <th>Referencia</th>
            <th>Fecha</th>
          </tr>
        </thead>
        @switch (paymentsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pagination.take()" [columns]="4"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="4" (retry)="paymentsResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (p of paymentsList.rows()?.data ?? []; track p.id) {
                <tr>
                  <td>{{ p.student.firstName }} {{ p.student.fatherName }}</td>
                  <td>{{ p.amount | number: '1.2-2' }}</td>
                  <td>{{ p.reference || '-' }}</td>
                  <td>{{ p.paidAt | date: 'dd/MM/yyyy' }}</td>
                </tr>
              } @empty {
                @if (filtered()) {
                  <tr
                    uiTableEmpty
                    [columns]="4"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún pago coincide con los filtros aplicados."
                  >
                    <button uiButton variant="ghost" size="sm" (click)="clearFilters()">Limpiar filtros</button>
                  </tr>
                } @else {
                  <tr uiTableEmpty [columns]="4" icon="banknote" title="Aún no hay pagos este año"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      @if (pagination.count()) {
        <div class="p-4">
          <lib-paginator
            [take]="pagination.take()"
            [skip]="pagination.skip()"
            [count]="pagination.count()"
            (skipChange)="pagination.updateSkip($event)"
            (takeChange)="pagination.updateTake($event)"
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

  /** payments with smooth loading: rows stay while the next page / filter loads. */
  protected readonly paymentsList = listState(this.paymentsResource);

  protected readonly filtered = computed(() => !!this.studentFilter() || !!this.pagination.search());

  protected readonly selectedStudentName = computed(() => {
    const s = this.students.value()?.find((st) => st.id === this.studentFilter());
    return s ? `${s.firstName} ${s.fatherName}` : '';
  });

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

  protected clearFilters() {
    this.pagination.updateSearch('');
    this.onStudentChange('');
  }
}
