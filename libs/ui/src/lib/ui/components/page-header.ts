import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BreadcrumbItem, Breadcrumbs } from './breadcrumbs';
import { Button } from './button';
import { UiIconName } from '../icons/icons';
import { Icon } from './icon';

/**
 * Top of a page: optional breadcrumb trail, title, subtitle and one primary action.
 *
 *   <lib-page-header
 *     title="Cursos"
 *     subtitle="Administra los cursos del periodo actual"
 *     [breadcrumbs]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos' }]"
 *     actionLabel="Nuevo curso"
 *     actionIcon="plus"
 *     (action)="create()"
 *   />
 */
@Component({
  selector: 'lib-page-header',
  imports: [Breadcrumbs, Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breadcrumbs()?.length) {
      <ui-breadcrumbs [items]="breadcrumbs()!" class="mb-2" />
    }
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="type-heading-lg text-ink-strong">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="type-body text-ink-muted">
            {{ subtitle() }}
          </p>
        }
      </div>
      @if (actionLabel()) {
        <button uiButton variant="primary" type="button" (click)="action.emit()">
          @if (actionIcon(); as iconName) {
            <ui-icon [name]="iconName" />
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string | undefined>('');
  /** Trail shown above the title; the last item is the current page. */
  breadcrumbs = input<readonly BreadcrumbItem[]>();
  actionLabel = input<string | undefined>();
  actionIcon = input<UiIconName | undefined>();
  action = output<void>();
}
