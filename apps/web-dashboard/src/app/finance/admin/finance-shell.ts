import { Modal, PageHeader } from '#/ui';
import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Auth from '../../auth/auth';
import ChargeForm from './charge-form';

/** Bumped after a write so the open finance page reloads its data. */
@Injectable({ providedIn: 'root' })
export class FinanceRefresh {
  readonly version = signal(0);
  bump() {
    this.version.update((v) => v + 1);
  }
}

/**
 * `/financial-module` (FIN-001): page header, the tabs of the finance sections and the routed
 * section. Each slice adds its tab: Cuentas (FIN-001-S01), Catálogo (S02).
 */
@Component({
  selector: 'app-finance-shell',
  imports: [PageHeader, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Finanzas' }]"
      title="Finanzas"
      subtitle="Cobros y cuentas familiares del colegio."
      [actionLabel]="canManage() ? 'Nuevo cargo' : undefined"
      actionIcon="plus"
      (action)="newCharge()"
    />
    <nav class="flex flex-wrap gap-1 border-b border-line mb-6" aria-label="Secciones de finanzas">
      @for (tab of tabs(); track tab.link) {
        <a
          [routerLink]="tab.link"
          routerLinkActive="border-primary! text-primary font-semibold"
          #active="routerLinkActive"
          [attr.aria-current]="active.isActive ? 'page' : null"
          class="px-3.5 py-2.5 -mb-px border-b-2 border-transparent text-ink-muted hover:text-ink-strong"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
    <router-outlet />
  `,
})
export default class FinanceShell {
  private auth = inject(Auth);
  private modal = inject(Modal);
  private refresh = inject(FinanceRefresh);

  protected readonly canManage = computed(() => this.auth.hasPermission('MANAGE_FINANCIALS'));
  protected readonly tabs = computed(() => [
    { label: 'Cuentas', link: '/financial-module/accounts' },
    // FIN-001-S02: the fee catalog and charge generation are for finance managers only.
    ...(this.canManage() ? [{ label: 'Catálogo', link: '/financial-module/catalog' }] : []),
  ]);

  protected newCharge() {
    this.modal.open(ChargeForm, { title: 'Nuevo cargo', size: 'medium' }).closed.subscribe(() => this.refresh.bump());
  }
}
