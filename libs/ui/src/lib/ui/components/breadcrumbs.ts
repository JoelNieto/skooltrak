import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** One step of the trail. Without `link` it renders as text (the current page, or a section with no page). */
export interface BreadcrumbItem {
  label: string;
  link?: string | readonly unknown[];
}

/**
 * Navigation trail above a page title:
 *
 *   <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Cursos', link: '/courses' }, { label: course.name }]" />
 *
 * Usually passed to the page header instead: `<lib-page-header title="…" [breadcrumbs]="[…]" />`.
 * The last item is marked as the current page.
 */
@Component({
  selector: 'ui-breadcrumbs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs ui-breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        @for (item of items(); track $index; let last = $last) {
          <li>
            @if (item.link && !last) {
              <a [routerLink]="item.link">{{ item.label }}</a>
            } @else {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
    .ui-breadcrumbs {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: var(--ui-ink-muted);
      padding-block: 0.25rem;
    }
    ol {
      display: flex;
      align-items: center;
      white-space: nowrap;
      min-height: min-content;
    }
    a {
      color: inherit;
      transition: color 0.15s var(--ui-ease);
    }
    a:hover {
      color: var(--ui-ink-strong);
      text-decoration: none;
    }
    [aria-current='page'] {
      color: var(--ui-ink-strong);
      font-weight: 500;
    }
  `,
})
export class Breadcrumbs {
  readonly items = input.required<readonly BreadcrumbItem[]>();
}
