import { Breadcrumbs, Icon, UiInputGroup } from '#/ui';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import Auth from '../auth/auth';
import { AdminCounts } from './admin-counts';
import { ADMIN_NAV, AdminNavGroup, adminSectionPath, findAdminNavItem } from './admin-nav';
import { AdminSettingsRail } from './components/admin-settings-rail';

/**
 * The admin panel shell: page header with a section search, the grouped settings rail and, for
 * every section but the overview, the section's title and description above its page.
 */
@Component({
  selector: 'app-admin',
  imports: [Breadcrumbs, RouterOutlet, Icon, UiInputGroup, AdminSettingsRail],
  providers: [AdminCounts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:keydown)': 'onKeydown($event)',
    '[style.--admin-header-h.px]': 'headerHeight()',
  },
  template: `
    <!-- Sticky inside the dashboard's scrolling <main>; bleeds over the page gutter so content
         scrolling underneath never shows at its sides. -->
    <header
      #header
      class="sticky top-0 z-20 mx-[calc(-1*var(--ui-page-gutter,1rem))] border-b border-line bg-surface-0/95 px-(--ui-page-gutter) py-3 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80"
    >
      <div class="mx-auto flex max-w-400 flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div class="flex min-w-0 flex-col gap-1">
          <ui-breadcrumbs [items]="breadcrumbs()" />
          <h1 class="type-heading-lg text-ink-strong">Administración</h1>
          <p class="hidden text-[15px] text-ink-muted sm:block">
            Configura la estructura de tu colegio, su comunidad y la operación diaria.
          </p>
        </div>
        <label uiInputGroup class="w-full sm:w-75">
          <ui-icon name="search" class="text-base text-ink-subtle" />
          <input
            #search
            type="search"
            class="pl-0"
            aria-label="Buscar en administración"
            aria-keyshortcuts="Control+K"
            placeholder="Buscar sección o ajuste…"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
            (keydown.enter)="openFirstMatch()"
            (keydown.escape)="query.set('')"
          />
          <kbd
            class="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-subtle sm:inline"
            aria-hidden="true"
            >Ctrl K</kbd
          >
        </label>
      </div>
    </header>

    <div class="mx-auto flex max-w-400 flex-col gap-7 pt-6">
      <div class="flex flex-col items-start gap-8 lg:flex-row">
        <!-- Wide screens: the rail sits beside the content. -->
        <app-admin-settings-rail
          class="hidden w-62 shrink-0 lg:sticky lg:top-[calc(var(--admin-header-h,0px)+1.5rem)] lg:block lg:max-h-[calc(100dvh-var(--admin-header-h,0px)-3rem)] lg:overflow-y-auto"
          [groups]="visibleGroups()"
          [active]="activePath()"
          [badges]="badges()"
        />
        <!-- Narrow screens: the rail folds into a disclosure above the content. -->
        <details
          class="w-full rounded-2xl border border-line bg-surface-1 lg:hidden"
          [open]="query().length > 0"
        >
          <summary class="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-semibold text-ink-strong">
            <ui-icon name="menu" class="text-lg text-ink-muted" />
            <span class="flex-1">{{ current()?.item?.label ?? 'Secciones' }}</span>
            <ui-icon name="chevron-down" class="text-lg text-ink-muted" />
          </summary>
          <div class="border-t border-line p-3">
            <app-admin-settings-rail [groups]="visibleGroups()" [active]="activePath()" [badges]="badges()" />
          </div>
        </details>

        <section class="flex w-full min-w-0 flex-1 flex-col gap-5" [attr.aria-labelledby]="current() ? 'admin-section-title' : null">
          @if (current(); as section) {
            @if (section.item.path) {
              <div class="flex max-w-140 flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-[0.06em] text-ink-subtle">{{ section.group.title }}</span>
                <h2 id="admin-section-title" class="type-heading-md text-ink-strong">{{ section.item.label }}</h2>
                <p class="text-ink-muted">{{ section.item.description }}</p>
              </div>
            }
          }
          <router-outlet />
        </section>
      </div>
    </div>
  `,
})
export default class Admin {
  #router = inject(Router);
  #auth = inject(Auth);
  #counts = inject(AdminCounts);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');

  /** The sticky header's height, so the rail can stick just below it. */
  protected readonly headerHeight = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.header().nativeElement;
      const observer = new ResizeObserver(() => this.headerHeight.set(el.offsetHeight));
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly activePath = computed(() => adminSectionPath(this.#url()));
  protected readonly current = computed(() => findAdminNavItem(this.activePath()));

  protected readonly breadcrumbs = computed(() => {
    const section = this.current();
    return section?.item.path
      ? [{ label: 'Inicio', link: '/' }, { label: 'Administración', link: '/admin' }, { label: section.item.label }]
      : [{ label: 'Inicio', link: '/' }, { label: 'Administración' }];
  });

  protected readonly query = signal('');

  /** The rail's groups the user may open, narrowed to the search when there is one. */
  protected readonly visibleGroups = computed<AdminNavGroup[]>(() => {
    const q = normalize(this.query().trim());
    return ADMIN_NAV.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.permission || this.#auth.hasPermission(item.permission)) &&
          (!q || [item.label, group.title, item.description].some((text) => normalize(text).includes(q))),
      ),
    })).filter((group) => group.items.length > 0);
  });

  protected readonly badges = computed(() => ({ 'join-requests': this.#counts.joinRequests() }));

  protected openFirstMatch(): void {
    const first = this.visibleGroups()[0]?.items[0];
    if (!first || !this.query().trim()) return;
    this.query.set('');
    void this.#router.navigate(first.path ? ['/admin', first.path] : ['/admin']);
  }

  /** Ctrl+K / ⌘K focuses the section search. */
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }
}

/** Lower case without accents, so "planes" finds "Planes" and "asignatura" finds "Asignatura". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
