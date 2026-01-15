import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState, PageHeader } from '@/ui';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-financial-module',
  imports: [EmptyState, PageHeader, RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Administración</li>
        <li>Finanzas</li>
      </ul>
    </div>

    <lib-page-header
      title="Módulo financiero"
      subtitle="Gestión de pagos y cuotas (MVP en preparación)."
    />

    <lib-empty-state
      title="Funcionalidad en construcción"
      description="Aquí podrás gestionar colegiaturas, pagos y estados de cuenta."
      icon="payments"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FinancialModule {}
