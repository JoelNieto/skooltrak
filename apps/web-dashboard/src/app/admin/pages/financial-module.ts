import { Confirmation, EmptyState, Modal, PageHeader, Toast } from '@/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import {
  AdminChargesBySchoolDocument,
  AdminChargesBySchoolQuery,
  AdminRemoveChargeDocument,
} from '../../graphql/generated/graphql';
import CreateChargeForm from '../forms/create-charge-form';

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

type PaymentType = {
  id: string;
  amount: number;
  paidAt: string;
  reference?: string | null;
  student: { id: string; firstName: string; fatherName: string };
};

@Component({
  selector: 'app-financial-module',
  imports: [
    DatePipe,
    DecimalPipe,
    EmptyState,
    FormsModule,
    NgClass,
    PageHeader,
    RouterLink,
    TabList,
    Tab,
    Tabs,
    TabPanel,
    TabContent,
  ],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/admin">Admin</a></li>
        <li>Finanzas</li>
      </ul>
    </div>

    <lib-page-header title="Módulo financiero" subtitle="Gestión de cargos, pagos y estados de cuenta." />

    <div ngTabs>
      <div class="flex justify-between items-center mt-4">
        <div ngTabList selectionMode="follow" selectedTab="charges" class="tabs tabs-box">
          <div ngTab value="charges" class="tab">Cargos</div>
          <div ngTab value="payments" class="tab">Pagos</div>
        </div>
        <div class="flex gap-2 items-center">
          <select
            class="select select-primary select-sm"
            [ngModel]="yearFilter()"
            (ngModelChange)="yearFilter.set($event)"
          >
            @for (y of years(); track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
          <button class="btn btn-primary btn-sm" (click)="openCreateCharge()">
            <span class="material-symbols-outlined">add</span> Nuevo cargo
          </button>
        </div>
      </div>
      <div class="p-1">
        <div ngTabPanel value="charges">
          <ng-template ngTabContent>
            <div class="bg-base-100 rounded-lg border border-base-300 mt-4">
              @if (chargesResource.isLoading()) {
                <div class="p-8 text-center">Cargando...</div>
              } @else {
                <table class="table">
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
                    @for (c of chargesResource.value(); track c.id) {
                      <tr>
                        <td>{{ c.student.firstName }} {{ c.student.fatherName }}</td>
                        <td>{{ c.description || '-' }}</td>
                        <td>
                          <span class="badge badge-soft">{{ c.chargeType }}</span>
                        </td>
                        <td>{{ c.amount | number: '1.2-2' }}</td>
                        <td>{{ c.dueDate | date: 'dd/MM/yyyy' }}</td>
                        <td>
                          <span class="badge" [ngClass]="statusClass(c.status)">{{ c.status }}</span>
                        </td>
                        <td>
                          <button class="btn btn-ghost btn-sm" (click)="removeCharge(c.id)">
                            <span class="material-symbols-outlined text-error">delete</span>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7">
                          <lib-empty-state
                            title="Sin cargos"
                            description="Crea cargos para estudiantes o planes de estudio."
                            icon="receipt_long"
                            actionLabel="Nuevo cargo"
                            (action)="openCreateCharge()"
                          />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </ng-template>
        </div>
        <div ngTabPanel value="payments">
          <ng-template ngTabContent>
            <div class="bg-base-100 rounded-lg border border-base-300 mt-4 p-4">
              <lib-empty-state
                title="Registro de pagos"
                description="Los pagos se registran desde el detalle del estudiante o próximamente desde aquí."
                icon="payments"
              />
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FinancialModule {
  private apollo = inject(Apollo);
  private store = inject(Store);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  yearFilter = signal<number>(new Date().getFullYear());

  years = computed(() => {
    const y = this.store.currentSchool()?.currentYear ?? new Date().getFullYear();
    return [y, y - 1, y - 2];
  });

  public chargesResource = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
      year: this.yearFilter(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) return of<ChargeType[]>([]);
      return this.apollo
        .watchQuery({
          query: AdminChargesBySchoolDocument,
          variables: {
            schoolId: params.schoolId,
            year: params.year,
          },
        })
        .valueChanges.pipe(map((r) => (r.data?.chargesBySchool as AdminChargesBySchoolQuery['chargesBySchool']) ?? []));
    },
  });

  statusClass(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'badge-warning',
      PAID: 'badge-success',
      PARTIAL: 'badge-info',
      OVERDUE: 'badge-error',
    };
    return m[status] ?? 'badge-ghost';
  }

  openCreateCharge() {
    this.modal.open(CreateChargeForm, { title: 'Nuevo cargo', size: 'medium' }).closed.subscribe(() => {
      this.chargesResource.reload();
    });
  }

  removeCharge(id: string) {
    this.confirmation
      .confirm({ title: 'Eliminar cargo', message: '¿Estás seguro de eliminar este cargo?' })
      .pipe(
        filter(Boolean),
        switchMap(() =>
          this.apollo.mutate({
            mutation: AdminRemoveChargeDocument,
            variables: { id },
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Cargo eliminado');
          this.chargesResource.reload();
        },
        error: (e) => this.toast.showError(e?.message ?? 'Error'),
      });
  }
}
