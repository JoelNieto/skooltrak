import { EmptyState, PageHeader } from '#/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-financial-module',
  imports: [EmptyState, PageHeader],
  template: `
    <lib-page-header
      [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Administración' }, { label: 'Finanzas' }]"
      title="Módulo financiero"
      subtitle="Gestión de pagos y cuotas (MVP en preparación)."
    />

    <lib-empty-state
      title="Funcionalidad en construcción"
      description="Aquí podrás gestionar colegiaturas, pagos y estados de cuenta."
      icon="payments"
    />
  `,
})
export default class FinancialModule {}
