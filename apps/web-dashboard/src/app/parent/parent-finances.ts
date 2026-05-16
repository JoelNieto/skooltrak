import { Loader, PageHeader } from '@/ui';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import Store from '../core/store';

type StudentFinancialSummaryType = {
  studentId: string;
  firstName: string;
  fatherName: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

@Component({
  selector: 'app-parent-finances',
  imports: [Loader, PageHeader],
  template: `
    <lib-page-header
      title="Estado de cuenta"
      subtitle="Resumen financiero de tus hijos."
    />

    @if (summaryResource.isLoading()) {
      <div class="flex justify-center py-8">
        <lib-loader />
      </div>
    }

    @if (summaryResource.hasValue()) {
      @let items = summaryResource.value() ?? [];
      @if (items.length === 0) {
        <div class="rounded-lg border border-base-200 bg-base-100 p-8 text-center text-base-content/70">
          No tienes estudiantes vinculados o no hay información financiera disponible.
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (child of items; track child.studentId) {
            <div class="card border border-base-200 bg-base-100">
              <div class="card-body">
                <h3 class="card-title text-base">
                  {{ child.firstName }} {{ child.fatherName }}
                </h3>
                <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-base-content/60">Cargos:</span>
                    <span class="ml-1 font-medium">{{ formatCurrency(child.totalCharges) }}</span>
                  </div>
                  <div>
                    <span class="text-base-content/60">Pagos:</span>
                    <span class="ml-1 font-medium">{{ formatCurrency(child.totalPayments) }}</span>
                  </div>
                  <div class="col-span-2 mt-1 border-t border-base-200 pt-2">
                    <span class="text-base-content/60">Saldo:</span>
                    <span
                      class="ml-1 font-semibold"
                      [class.text-success]="child.balance >= 0"
                      [class.text-warning]="child.balance < 0"
                    >
                      {{ formatCurrency(child.balance) }}
                    </span>
                    <span class="ml-1 text-xs text-base-content/60">
                      {{ child.balance >= 0 ? '(Al día)' : '(Pendiente)' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ParentFinances {
  #store = inject(Store);

  public summaryResource = httpResource<StudentFinancialSummaryType[]>(
    () => '/api/v1/financial/linked-students-summary',
    { defaultValue: [] },
  );

  formatCurrency(value: number): string {
    const code = this.#store.currentSchool()?.currencyCode ?? 'USD';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
    }).format(value);
  }
}
