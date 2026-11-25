import { Badge, Icon } from '#/ui';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminNavGroup } from '../admin-nav';

/**
 * The admin panel's section menu: groups of links to the `/admin` child routes.
 * The active entry is passed in (`active`), so the shell decides it from the URL.
 */
@Component({
  selector: 'app-admin-settings-rail',
  imports: [RouterLink, Icon, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Secciones de administración" class="flex flex-col gap-5">
      @for (group of groups(); track group.title) {
        <div class="flex flex-col gap-0.5">
          <p class="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{{ group.title }}</p>
          @for (item of group.items; track item.path) {
            <a
              [routerLink]="item.path ? ['/admin', item.path] : ['/admin']"
              [attr.aria-current]="item.path === active() ? 'page' : null"
              class="flex min-h-10 items-center gap-3 rounded-[10px] px-3 py-2 transition-colors duration-150"
              [class]="
                item.path === active()
                  ? 'bg-action-subtle font-semibold text-primary'
                  : 'text-ink hover:bg-surface-2 hover:text-ink-strong'
              "
            >
              <ui-icon [name]="item.icon" class="text-lg" />
              <span class="flex-1">{{ item.label }}</span>
              @if (badges()[item.path]; as count) {
                <span uiBadge tone="new" size="sm" [attr.aria-label]="count + ' pendientes'">{{
                  count > 99 ? '99+' : count
                }}</span>
              }
            </a>
          }
        </div>
      } @empty {
        <p class="px-3 text-sm text-ink-muted">Ninguna sección coincide con la búsqueda.</p>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class AdminSettingsRail {
  readonly groups = input.required<readonly AdminNavGroup[]>();
  /** Path of the current section ('' for the overview). */
  readonly active = input<string>('');
  /** Counts shown next to an entry, by its path (e.g. pending join requests). */
  readonly badges = input<Readonly<Record<string, number | undefined>>>({});
}
