import {
  Alert,
  Button,
  Icon,
  Modal,
  PageHeader,
  UiSelect,
  UiTab,
  UiTabContent,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Auth from '../../auth/auth';
import Store from '../../core/store';
import StudentBalance from '../../students/student-balance';
import ChargesSection from '../components/charges-section';
import PaymentsSection from '../components/payments-section';
import StudentSearch from '../components/student-search';
import CreateChargeForm from '../forms/create-charge-form';
import CreatePaymentForm from '../forms/create-payment-form';

@Component({
  selector: 'app-financial-module',
  imports: [
    Alert,
    UiSelect,
    Button,
    ChargesSection,
    FormsModule,
    PageHeader,
    PaymentsSection,
    UiTabList,
    UiTab,
    UiTabs,
    UiTabPanel,
    UiTabContent,
    StudentSearch,
    StudentBalance,
    Icon,
  ],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Finanzas' }]"
      title="Módulo financiero"
      subtitle="Gestión de cargos, pagos y estados de cuenta."
    />

    <div uiTabs>
      <div class="flex justify-between items-center mt-4">
        <div uiTabList selectedTab="charges" aria-label="Secciones de finanzas">
          <button uiTab value="charges">Cargos</button>
          <button uiTab value="payments">Pagos</button>
          <button uiTab value="balances">Saldos</button>
        </div>
        <div class="flex gap-2 items-center">
          <select uiSelect size="sm" [ngModel]="yearFilter()" (ngModelChange)="yearFilter.set($event)">
            @for (y of years(); track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
          @if (!auth.isStudent()) {
            <button uiButton variant="primary" size="sm" (click)="openCreateCharge()">
              <ui-icon name="plus" /> Nuevo cargo
            </button>
            <button uiButton variant="primary" size="sm" (click)="openCreatePayment()">
              <ui-icon name="plus" /> Registrar pago
            </button>
          }
        </div>
      </div>
      <div class="p-1">
        <div uiTabPanel value="charges">
          <ng-template uiTabContent>
            <app-charges-section [year]="yearFilter()" [reloadToken]="chargesVersion()" />
          </ng-template>
        </div>
        <div uiTabPanel value="payments">
          <ng-template uiTabContent>
            <app-payments-section [year]="yearFilter()" [reloadToken]="paymentsVersion()" />
          </ng-template>
        </div>
        <div uiTabPanel value="balances">
          <ng-template uiTabContent>
            @if (isStaff()) {
              <div class="flex flex-col gap-4">
                <app-student-search (selected)="onStudentSelected($event)" />
                @if (selectedStudentId(); as id) {
                  <app-student-balance [studentId]="id" />
                } @else {
                  <div uiAlert>Selecciona un alumno para consultar su estado de cuenta.</div>
                }
              </div>
            } @else {
              @if (store.currentStudentId(); as id) {
                <app-student-balance [studentId]="id" />
              } @else {
                <div uiAlert tone="warning">No se encontró un alumno asociado a esta cuenta.</div>
              }
            }
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export default class FinancialModule {
  store = inject(Store);
  auth = inject(Auth);
  private modal = inject(Modal);

  yearFilter = signal<number>(new Date().getFullYear());
  chargesVersion = signal(0);
  paymentsVersion = signal(0);

  /** Staff with finance access can look up any student; others only see their own balance. */
  public isStaff = computed(
    () => this.auth.hasPermission('VIEW_FINANCIALS') || this.auth.hasPermission('MANAGE_FINANCIALS'),
  );

  public selectedStudentId = signal<string | null>(null);

  years = computed(() => {
    const y = this.store.currentSchool()?.currentYear ?? new Date().getFullYear();
    return [y, y - 1, y - 2];
  });

  public onStudentSelected(event: { id: string; name: string }) {
    this.selectedStudentId.set(event.id || null);
  }

  openCreateCharge() {
    this.modal.open(CreateChargeForm, { title: 'Nuevo cargo', size: 'medium' }).closed.subscribe(() => {
      this.chargesVersion.update((v) => v + 1);
    });
  }

  openCreatePayment() {
    this.modal.open(CreatePaymentForm, { title: 'Registrar pago', size: 'medium' }).closed.subscribe(() => {
      this.paymentsVersion.update((v) => v + 1);
    });
  }
}
