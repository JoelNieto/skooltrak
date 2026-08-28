import { Modal, PageHeader } from '#/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Store from '../../core/store';
import Auth from '../../auth/auth';
import ChargesSection from '../components/charges-section';
import PaymentsSection from '../components/payments-section';
import CreateChargeForm from '../forms/create-charge-form';
import CreatePaymentForm from '../forms/create-payment-form';

@Component({
  selector: 'app-financial-module',
  imports: [
    ChargesSection,
    FormsModule,
    PageHeader,
    PaymentsSection,
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
          @if (!auth.isStudent()) {
            <button class="btn btn-primary btn-sm" (click)="openCreateCharge()">
              <span class="material-symbols-outlined">add</span> Nuevo cargo
            </button>
            <button class="btn btn-primary btn-sm" (click)="openCreatePayment()">
              <span class="material-symbols-outlined">add</span> Registrar pago
            </button>
          }
        </div>
      </div>
      <div class="p-1">
        <div ngTabPanel value="charges">
          <ng-template ngTabContent>
            <app-charges-section [year]="yearFilter()" [reloadToken]="chargesVersion()" />
          </ng-template>
        </div>
        <div ngTabPanel value="payments">
          <ng-template ngTabContent>
            <app-payments-section [year]="yearFilter()" [reloadToken]="paymentsVersion()" />
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export default class FinancialModule {
  private store = inject(Store);
  auth = inject(Auth);
  private modal = inject(Modal);

  yearFilter = signal<number>(new Date().getFullYear());
  chargesVersion = signal(0);
  paymentsVersion = signal(0);

  years = computed(() => {
    const y = this.store.currentSchool()?.currentYear ?? new Date().getFullYear();
    return [y, y - 1, y - 2];
  });

  openCreateCharge() {
    this.modal
      .open(CreateChargeForm, { title: 'Nuevo cargo', size: 'medium' })
      .closed.subscribe(() => {
        this.chargesVersion.update((v) => v + 1);
      });
  }

  openCreatePayment() {
    this.modal
      .open(CreatePaymentForm, { title: 'Registrar pago', size: 'medium' })
      .closed.subscribe(() => {
        this.paymentsVersion.update((v) => v + 1);
      });
  }
}
