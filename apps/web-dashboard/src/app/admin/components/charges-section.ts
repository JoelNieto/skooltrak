import {
  Badge,
  BadgeTone,
  Button,
  Confirmation,
  EmptyState,
  Icon,
  Pagination,
  Paginator,
  Toast,
  UiField,
  UiInput,
  UiSelect,
  UiTable,
} from '#/ui';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import Store from '../../core/store';
import Auth from '../../auth/auth';

type ChargeType = {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  chargeType: string;
  status: string;
  student: { id: string; firstName: string; fatherName: string };
  studyPlan?: { id: string; name: string } | null;
};

type StudentOption = { id: string; firstName: string; fatherName: string };

@Component({
  selector: 'app-charges-section',
  imports: [
    UiTable,
    Badge,
    UiInput,
    UiSelect,
    Button,
    DatePipe,
    DecimalPipe,
    EmptyState,
    FormsModule,
    Paginator,
    UiField,
    Icon,
  ],
  providers: [Pagination],
  template: `
    <div class="bg-surface-1 rounded-lg border border-line">
      <div class="flex flex-wrap gap-2 items-end p-3 border-b border-line">
        <ui-field label="Estado">
          <select uiSelect size="sm" [ngModel]="statusFilter()" (ngModelChange)="onFilterChange('status', $event)">
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PAID">PAID</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </ui-field>
        <ui-field label="Tipo">
          <select uiSelect size="sm" [ngModel]="typeFilter()" (ngModelChange)="onFilterChange('type', $event)">
            <option value="">Todos</option>
            <option value="CUSTOM">CUSTOM</option>
            <option value="TUITION">TUITION</option>
            <option value="ENROLLMENT">ENROLLMENT</option>
          </select>
        </ui-field>
        @if (showStudentFilter()) {
          <ui-field label="Estudiante">
            <select uiSelect size="sm" [ngModel]="studentFilter()" (ngModelChange)="onFilterChange('student', $event)">
              <option value="">Todos</option>
              @for (s of students.value(); track s.id) {
                <option [value]="s.id">{{ s.firstName }} {{ s.fatherName }}</option>
              }
            </select>
          </ui-field>
        }
        <ui-field label="Descripción" class="grow min-w-48">
          <input
            uiInput
            size="sm"
            type="search"
            placeholder="Buscar descripción..."
            [ngModel]="pagination.search()"
            (ngModelChange)="pagination.updateSearch($event)"
          />
        </ui-field>
      </div>

      @if (chargesResource.isLoading()) {
        <div class="p-8 text-center">Cargando...</div>
      } @else if (chargesResource.value()?.data.length) {
        <table uiTable>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of chargesResource.value()?.data ?? []; track c.id) {
              <tr>
                <td>{{ c.student.firstName }} {{ c.student.fatherName }}</td>
                <td>{{ c.description || '-' }}</td>
                <td>
                  <span uiBadge>{{ c.chargeType }}</span>
                </td>
                <td>{{ c.amount | number: '1.2-2' }}</td>
                <td>{{ c.dueDate | date: 'dd/MM/yyyy' }}</td>
                <td>
                  <span uiBadge [tone]="statusTone(c.status)">{{ c.status }}</span>
                </td>
                <td>
                  @if (!isStudent()) {
                    <button uiButton variant="ghost" size="sm" (click)="removeCharge(c.id)">
                      <ui-icon name="trash-2" class="text-error" />
                    </button>
                  }
                </td>
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
            title="Sin cargos"
            description="No se encontraron cargos con los filtros aplicados."
            icon="receipt"
          />
        </div>
      }
    </div>
  `,
})
export default class ChargesSection {
  private http = inject(HttpClient);
  private store = inject(Store);
  private auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);
  public pagination = inject(Pagination);

  public year = input<number>(new Date().getFullYear());
  public reloadToken = input<number>(0);

  public statusFilter = signal('');
  public typeFilter = signal('');
  public studentFilter = signal('');

  public isStudent = this.auth.isStudent;
  public showStudentFilter = computed(() => !this.isStudent());

  public students = httpResource<StudentOption[]>(() => {
    if (!this.showStudentFilter()) return undefined;
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return { url: `/api/v1/students/by-school/${schoolId}` };
  });

  public chargesResource = httpResource<{ data: ChargeType[]; total: number }>(
    () => {
      const year = this.year();
      const skip = this.pagination.skip();
      const take = this.pagination.take();
      const search = this.pagination.search();
      const status = this.statusFilter();
      const chargeType = this.typeFilter();
      const studentId = this.studentFilter();
      const reload = this.reloadToken();

      if (this.isStudent()) {
        return {
          url: '/api/v1/financial/charges/student',
          params: toFetchQueryRecord({
            year,
            status,
            chargeType,
            description: search,
            skip,
            take,
            reloadToken: reload,
          }),
        };
      }

      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: '/api/v1/financial/charges/by-school',
        params: toFetchQueryRecord({
          schoolId,
          year,
          status,
          chargeType,
          studentId: studentId || undefined,
          description: search,
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
      const value = this.chargesResource.value();
      if (value) {
        this.pagination.updateCount(value.total);
      }
    });
  }

  public onFilterChange(kind: 'status' | 'type' | 'student', value: string) {
    if (kind === 'status') this.statusFilter.set(value);
    else if (kind === 'type') this.typeFilter.set(value);
    else this.studentFilter.set(value);
    this.pagination.updateSkip(0);
  }

  statusTone(status: string): BadgeTone {
    const m: Record<string, BadgeTone> = {
      PENDING: 'warning',
      PAID: 'success',
      PARTIAL: 'info',
      OVERDUE: 'danger',
    };
    return m[status] ?? 'neutral';
  }

  removeCharge(id: string) {
    this.confirmation
      .confirm({ title: 'Eliminar cargo', message: '¿Estás seguro de eliminar este cargo?' })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.http.delete(`/api/v1/financial/charges/${id}`).subscribe({
          next: () => {
            this.toast.showSuccess('Cargo eliminado');
            this.chargesResource.reload();
          },
          error: (e) => this.toast.showError(e?.message ?? 'Error'),
        });
      });
  }
}
