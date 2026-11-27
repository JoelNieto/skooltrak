import { Badge, BadgeTone, BrandLogo, Confirmation, Icon, UiIconName } from '#/ui';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, map, of, switchMap, timer } from 'rxjs';
import Auth from '../auth/auth';
import { CommunicationApi } from '../communication/communication-api';
import { NotificationsBadge } from '../notifications/notifications-badge';
import { RailTooltip } from './rail-tooltip';
import { getContentColor, isValidHex, schoolInitials } from './school-colors';
import { SidebarLayout } from './sidebar-layout';
import Store, { CurrentSchool } from './store';
import { ThemePreference, ThemeService } from './theme.service';

type SidebarSchool = {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

type NavItem = {
  label: string;
  icon: UiIconName;
  link: string | string[];
  count?: number | null;
  tone?: BadgeTone;
};

type NavSection = { title?: string; items: NavItem[] };

/** Show the switcher's search box once a person belongs to more schools than this. */
const SEARCH_THRESHOLD = 5;

const THEMES: { value: ThemePreference; label: string; icon: UiIconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'sun-moon' },
];

/**
 * A school's crest on a white tile, so any logo (wide, round, dark or light) reads on both themes.
 * Schools without a logo get a monogram in their own colour.
 */
@Component({
  selector: 'app-school-crest',
  host: {
    class: 'grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-black/10 shadow-xs',
    '[class]': 'sizeClass()',
  },
  template: `@if (school().logoUrl) {
      <img [src]="school().logoUrl" alt="" class="size-full object-contain" />
    } @else {
      <span
        class="grid size-full place-items-center font-display font-bold"
        [class.text-lg]="size() !== 'sm'"
        [class.text-sm]="size() === 'sm'"
        [style.background]="monogramBg()"
        [style.color]="monogramFg()"
        >{{ initials() }}</span
      >
    }`,
})
export class SchoolCrest {
  readonly school = input.required<SidebarSchool>();
  readonly size = input<'lg' | 'md' | 'sm'>('lg');

  protected readonly sizeClass = computed(() => {
    const logo = !!this.school().logoUrl;
    switch (this.size()) {
      case 'lg':
        return logo ? 'size-14 rounded-xl p-1.5' : 'size-14 rounded-xl';
      case 'md':
        return logo ? 'size-12 rounded-xl p-1' : 'size-12 rounded-xl';
      default:
        return logo ? 'size-10 rounded-lg p-1' : 'size-10 rounded-lg';
    }
  });
  protected readonly initials = computed(() => schoolInitials(this.school().name));
  protected readonly monogramBg = computed(() => {
    const c = this.school().primaryColor;
    return isValidHex(c) ? c : 'var(--app-school)';
  });
  protected readonly monogramFg = computed(() => {
    const c = this.school().primaryColor;
    return isValidHex(c) ? getContentColor(c) : '#fafafa';
  });
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [
    Badge,
    BrandLogo,
    CdkScrollable,
    Icon,
    NgTemplateOutlet,
    OverlayModule,
    RailTooltip,
    RouterLink,
    RouterLinkActive,
    SchoolCrest,
  ],
  host: { '[attr.data-compact]': 'compact()' },
  template: `<div class="relative flex h-full flex-col">
      <!-- School header: the school's crest and colour lead; Skooltrak signs off at the bottom. -->
      <div class="app-school-band shrink-0 overflow-hidden border-b" [class]="compact() ? 'px-2 py-3.5' : 'px-3 py-4'">
        @if (currentSchool(); as school) {
          @if (canSwitchSchool()) {
            <button
              type="button"
              cdkOverlayOrigin
              #schoolOrigin="cdkOverlayOrigin"
              #schoolButton
              (click)="toggleSwitcher()"
              aria-haspopup="listbox"
              [attr.aria-expanded]="switcherOpen()"
              [attr.aria-label]="school.name + ', cambiar colegio'"
              [appRailTooltip]="school.name"
              [appRailTooltipEnabled]="compact() && !switcherOpen()"
              class="flex w-full cursor-pointer items-center gap-3 rounded-xl text-left transition-colors duration-150 app-school-hover"
              [class.p-2]="!compact()"
              [class.p-1]="compact()"
              [class.justify-center]="compact()"
            >
              <ng-container *ngTemplateOutlet="schoolIdentity; context: { $implicit: school }" />
              @if (!compact()) {
                <ui-icon name="chevrons-up-down" class="text-base text-ink-subtle" />
              }
            </button>
            <ng-template
              cdkConnectedOverlay
              [cdkConnectedOverlayOrigin]="schoolOrigin"
              [cdkConnectedOverlayOpen]="switcherOpen()"
              [cdkConnectedOverlayPositions]="switcherPositions()"
              cdkConnectedOverlayHasBackdrop
              cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
              (backdropClick)="closeSwitcher()"
              (detach)="closeSwitcher(true)"
              (attach)="focusCurrentSchool()"
            >
              <div
                class="w-78 rounded-box border border-line bg-surface-1 p-2 shadow-[var(--ui-shadow-float)]"
                role="dialog"
                aria-label="Cambiar colegio"
                #switcherPanel
              >
                <p class="px-2 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                  Tus colegios
                </p>
                @if (schoolsList().length > searchThreshold) {
                  <label
                    class="mx-1 mb-2 flex h-9 items-center gap-2 rounded-lg border border-line-control px-2.5 text-ink-subtle focus-within:border-primary"
                  >
                    <ui-icon name="search" class="text-base" />
                    <input
                      id="sidebar-school-search"
                      type="text"
                      autocomplete="off"
                      placeholder="Buscar colegio"
                      aria-label="Buscar colegio"
                      class="w-full bg-transparent text-sm text-ink-strong outline-none"
                      [value]="query()"
                      (input)="query.set($any($event.target).value)"
                      (keydown.arrowdown)="moveFocus($event, 1)"
                    />
                  </label>
                }
                <div role="listbox" aria-label="Colegios" class="grid max-h-80 gap-0.5 overflow-y-auto">
                  @for (option of filteredSchools(); track option.id) {
                    <button
                      type="button"
                      role="option"
                      [attr.aria-selected]="option.id === school.id"
                      (click)="chooseSchool(option)"
                      (keydown.arrowdown)="moveFocus($event, 1)"
                      (keydown.arrowup)="moveFocus($event, -1)"
                      class="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                    >
                      <app-school-crest [school]="option" size="sm" />
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold leading-snug text-ink-strong">{{ option.name }}</span>
                        @if (option.city) {
                          <span class="block truncate text-xs text-ink-muted">{{ option.city }}</span>
                        }
                      </span>
                      @if (option.id === school.id) {
                        <ui-icon name="check" class="text-lg text-primary" />
                      }
                    </button>
                  } @empty {
                    <p class="px-2 py-4 text-center text-sm text-ink-muted">
                      Ningún colegio coincide con “{{ query() }}”.
                    </p>
                  }
                </div>
              </div>
            </ng-template>
          } @else {
            <div
              class="flex items-center gap-3"
              [class.p-2]="!compact()"
              [class.p-1]="compact()"
              [class.justify-center]="compact()"
              [appRailTooltip]="school.name"
              [appRailTooltipEnabled]="compact()"
            >
              <ng-container *ngTemplateOutlet="schoolIdentity; context: { $implicit: school }" />
            </div>
          }
        } @else {
          <div class="flex h-14 items-center" [class.justify-center]="compact()" [class.px-2]="!compact()">
            <ui-brand-logo [variant]="compact() ? 'isotype' : 'horizontal'" class="h-8" />
          </div>
        }
      </div>

      <button
        type="button"
        (click)="layout.toggle()"
        [attr.aria-label]="compact() ? 'Expandir menú' : 'Contraer menú'"
        [attr.aria-expanded]="!compact()"
        [appRailTooltip]="'Expandir menú'"
        [appRailTooltipEnabled]="compact()"
        [style.top.px]="compact() ? 29 : 39"
        class="absolute -right-3.25 z-10 hidden size-6.5 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface-1 text-ink-muted shadow-sm transition-colors hover:border-ink-subtle hover:text-ink-strong lg:grid"
      >
        <ui-icon [name]="compact() ? 'chevron-right' : 'chevron-left'" class="text-[15px]" />
      </button>

      <nav
        cdkScrollable
        class="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto py-3"
        [class]="compact() ? 'px-3.5' : 'px-3'"
        aria-label="Menú principal"
      >
        @for (section of sections(); track $index) {
          <div>
            @if (section.title) {
              @if (compact()) {
                <div class="mx-1.5 mb-2 h-px bg-line" aria-hidden="true"></div>
              } @else {
                <p class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {{ section.title }}
                </p>
              }
            }
            <ul
              class="space-y-0.5"
              [class.mt-1]="!!section.title && !compact()"
              [attr.aria-label]="section.title ?? null"
            >
              @for (item of section.items; track item.label) {
                <li><ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }" /></li>
              }
            </ul>
          </div>
        }
      </nav>

      <div class="shrink-0 space-y-1 border-t border-line pt-2.5 pb-3" [class]="compact() ? 'px-3.5' : 'px-3'">
        <ng-container *ngTemplateOutlet="navLink; context: { $implicit: notificationsItem() }" />

        @if (compact()) {
          <button
            type="button"
            (click)="cycleTheme()"
            [attr.aria-label]="'Tema: ' + currentTheme().label + '. Cambiar tema'"
            [appRailTooltip]="'Tema: ' + currentTheme().label"
            class="mx-auto flex h-10 w-11 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors duration-150 hover:bg-surface-2 hover:text-ink-strong"
          >
            <ui-icon [name]="currentTheme().icon" class="text-xl" />
          </button>
        } @else {
          <div class="flex h-10 items-center gap-3 px-3 text-ink">
            <ui-icon name="sun-moon" class="text-xl" />
            <span class="flex-1">Tema</span>
            <div class="flex gap-0.5 rounded-lg bg-surface-2 p-0.5" role="group" aria-label="Tema">
              @for (t of themes; track t.value) {
                <button
                  type="button"
                  (click)="theme.setTheme(t.value)"
                  [attr.aria-pressed]="theme.theme() === t.value"
                  [attr.aria-label]="t.label"
                  [title]="t.label"
                  class="grid h-6.5 w-7 cursor-pointer place-items-center rounded-md transition-colors hover:text-ink-strong"
                  [class]="theme.theme() === t.value ? 'bg-surface-1 text-ink-strong shadow-xs' : 'text-ink-muted'"
                >
                  <ui-icon [name]="t.icon" class="text-[15px]" />
                </button>
              }
            </div>
          </div>
        }

        <div class="dropdown w-full" [class]="compact() ? 'dropdown-right dropdown-end' : 'dropdown-top'">
          <div
            role="button"
            tabindex="0"
            [attr.aria-label]="compact() ? auth.userName() + ', menú de usuario' : null"
            [appRailTooltip]="auth.userName()"
            [appRailTooltipEnabled]="compact()"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 hover:bg-surface-2"
            [class.mx-auto]="compact()"
            [class.w-11]="compact()"
            [class.justify-center]="compact()"
          >
            <div
              class="flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full"
              [style.background]="auth.userColor()"
            >
              @if (avatarUrl.value()) {
                <img [src]="avatarUrl.value()" [alt]="auth.userName()" class="h-full w-full object-cover" />
              } @else {
                <span class="text-sm font-medium text-neutral-content">{{ auth.userInitials() }}</span>
              }
            </div>
            @if (!compact()) {
              <div class="min-w-0 flex-1 text-left">
                <p class="truncate text-sm font-semibold text-ink-strong">{{ auth.userName() }}</p>
                <p class="truncate text-xs text-ink-muted">Ver perfil</p>
              </div>
              <ui-icon name="chevrons-up-down" class="text-base text-ink-subtle" />
            }
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu z-50 w-56 rounded-box border border-line bg-surface-1 p-2 shadow-lg"
            [class.mb-2]="!compact()"
            [class.ml-3]="compact()"
          >
            <li>
              <a routerLink="profile">
                <ui-icon name="user" class="text-xl" />
                <span class="ml-1">Perfil</span>
              </a>
            </li>
            <li>
              <a routerLink="change-password">
                <ui-icon name="key-round" class="text-xl" />
                <span class="ml-1">Cambiar contraseña</span>
              </a>
            </li>
            <li>
              <button (click)="logout()">
                <ui-icon name="log-out" class="text-xl" />
                <span class="ml-1">Cerrar sesión</span>
              </button>
            </li>
          </ul>
        </div>

        @if (currentSchool()) {
          <div
            class="flex items-center gap-1.5 pt-1.5 text-[11px] text-ink-subtle"
            [class.justify-center]="compact()"
            [class.px-3]="!compact()"
            [appRailTooltip]="'Con tecnología de Skooltrak'"
            [appRailTooltipEnabled]="compact()"
          >
            <ui-brand-logo variant="isotype" class="h-4" [alt]="compact() ? 'Con tecnología de Skooltrak' : ''" />
            @if (!compact()) {
              <span>con <b class="font-semibold text-ink-muted">Skooltrak</b></span>
            }
          </div>
        }
      </div>
    </div>

    <ng-template #schoolIdentity let-school>
      <app-school-crest [school]="school" [size]="compact() ? 'md' : 'lg'" />
      @if (!compact()) {
        <span class="grid min-w-0 flex-1 gap-0.5">
          <span class="line-clamp-2 font-display text-[0.9375rem] leading-tight font-bold text-ink-strong">{{
            school.name
          }}</span>
          @if (school.city) {
            <span class="truncate text-xs text-ink-muted">{{ school.city }}</span>
          }
        </span>
      }
    </ng-template>

    <ng-template #navLink let-item>
      <a
        [routerLink]="item.link"
        routerLinkActive="bg-action-subtle text-primary font-semibold"
        [appRailTooltip]="item.label"
        [appRailTooltipCount]="item.count"
        [appRailTooltipEnabled]="compact()"
        class="relative flex h-10 items-center gap-3 rounded-lg text-ink transition-colors duration-150 hover:bg-surface-2 hover:text-ink-strong"
        [class.mx-auto]="compact()"
        [class.w-11]="compact()"
        [class.justify-center]="compact()"
        [class.w-full]="!compact()"
        [class.px-3]="!compact()"
      >
        <ui-icon [name]="item.icon" class="text-xl" />
        <span class="flex-1 truncate" [class.sr-only]="compact()">{{ item.label }}</span>
        @if (item.count) {
          <span
            uiBadge
            [tone]="item.tone ?? 'new'"
            size="sm"
            [attr.aria-label]="item.count + ' sin leer'"
            [class.ml-auto]="!compact()"
            [class]="compact() ? 'absolute -top-0.5 -right-1 h-4 min-w-4 px-1 text-[10px] ring-2 ring-surface-1' : ''"
            >{{ item.count > 99 ? '99+' : item.count }}</span
          >
        }
      </a>
    </ng-template>`,
})
export class Sidebar {
  protected readonly auth = inject(Auth);
  protected readonly store = inject(Store);
  protected readonly theme = inject(ThemeService);
  protected readonly layout = inject(SidebarLayout);

  protected readonly compact = this.layout.compact;
  protected readonly themes = THEMES;
  protected readonly searchThreshold = SEARCH_THRESHOLD;

  /** Finance staff: admins, or staff holding VIEW_FINANCIALS (parents see their own account instead). */
  protected readonly isFinanceStaff = computed(
    () =>
      this.auth.isAdmin() ||
      (this.auth.hasPermission('VIEW_FINANCIALS') && !this.auth.isParent() && !this.auth.isStudent()),
  );

  /** Shell hosts the store at `/store` (directory) and `/store/:slug` (catalog). */
  protected readonly storeLink = computed((): string[] => {
    const slug = this.store.currentSchool()?.slug;
    return slug ? ['/store', slug] : ['/store'];
  });

  /** Store back-office (products, categories, orders) — same remote as catalog, `/store/:slug/admin`. */
  protected readonly storeAdminLink = computed((): string[] => {
    const slug = this.store.currentSchool()?.slug;
    return slug ? ['/store', slug, 'admin'] : ['/store'];
  });
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #injector = inject(EnvironmentInjector);
  #elementInjector = inject(Injector);

  protected schools = rxResource({
    injector: this.#injector,
    stream: () =>
      this.#http.get<SidebarSchool[]>('/api/v1/schools').pipe(
        switchMap((schools) => {
          if (!schools?.length) return of<SidebarSchool[]>([]);
          return forkJoin(
            schools.map((s) =>
              s.logo
                ? this.#http
                    .get<{ url: string | null }>(`/api/v1/schools/${s.id}/presigned-logo-url`)
                    .pipe(map((r) => ({ ...s, logoUrl: r.url })))
                : of({ ...s, logoUrl: null as string | null }),
            ),
          );
        }),
      ),
  });

  /** ASM-001-S08: unread notifications, for the sidebar badge. */
  protected readonly notifications = inject(NotificationsBadge);

  /** COM-003 FR .15: unread channel posts and direct messages. */
  protected readonly unread = inject(CommunicationApi).unread;

  protected storeCartCount = rxResource({
    injector: this.#injector,
    params: () => ({ schoolId: this.store.currentSchool()?.id ?? '' }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of(0);
      }
      const schoolId = params.schoolId;
      return timer(0, 120000).pipe(
        switchMap(() =>
          this.#http.get<Array<{ quantity?: number }>>(`/api/v1/store/cart`, {
            params: { schoolId },
          }),
        ),
        map((items) => (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)),
      );
    },
  });

  protected avatarUrl = rxResource({
    injector: this.#injector,
    params: () => ({ id: this.auth.user()?.id, image: this.auth.user()?.image }),
    stream: ({ params }) => {
      const { id, image } = params;
      if (!image) return of(null);
      if (image.startsWith('http')) return of(image);
      if (!id) return of(null);
      return this.#http.get<{ url: string | null }>(`/api/v1/users/${id}/presigned-avatar-url`).pipe(map((r) => r.url));
    },
  });

  /**
   * `value()` throws while the resource is in an error state (e.g. a 403 for roles that may not list
   * schools), so read it only once it has one.
   */
  protected readonly schoolsList = computed((): SidebarSchool[] => {
    const s = this.schools.hasValue() ? this.schools.value() : undefined;
    return Array.isArray(s) ? s : [];
  });

  /** The current school with its sidebar fields (logo URL, city) from the list, falling back to the store. */
  protected readonly currentSchool = computed((): SidebarSchool | null => {
    const current = this.store.currentSchool();
    if (!current) return null;
    return this.schoolsList().find((s) => s.id === current.id) ?? (current as SidebarSchool);
  });

  protected readonly canSwitchSchool = computed(() => this.schoolsList().length > 1);

  protected readonly switcherOpen = signal(false);
  protected readonly query = signal('');
  protected readonly filteredSchools = computed(() => {
    const term = this.query().trim().toLowerCase();
    const list = this.schoolsList();
    if (!term) return list;
    return list.filter((s) => s.name.toLowerCase().includes(term) || (s.city ?? '').toLowerCase().includes(term));
  });

  /** Beside the crest on the rail; under the school header when expanded. */
  protected readonly switcherPositions = computed((): ConnectedPosition[] =>
    this.compact()
      ? [
          { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 12 },
          { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 12 },
        ]
      : [{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 }],
  );

  private readonly schoolButton = viewChild<ElementRef<HTMLButtonElement>>('schoolButton');
  private readonly switcherPanel = viewChild<ElementRef<HTMLElement>>('switcherPanel');

  protected readonly currentTheme = computed(() => THEMES.find((t) => t.value === this.theme.theme()) ?? THEMES[2]);

  protected readonly sections = computed((): NavSection[] => {
    const can = (p: string) => this.auth.hasPermission(p);
    const unread = this.unread.hasValue() ? this.unread.value() : undefined;
    const cart = this.storeCartCount.hasValue() ? this.storeCartCount.value() : 0;

    const general: NavItem[] = [
      { label: 'Inicio', icon: 'house', link: 'home' },
      ...(can('VIEW_COURSES') ? [{ label: 'Cursos', icon: 'book-open', link: 'courses' } as NavItem] : []),
      ...(can('VIEW_FILES') ? [{ label: 'Archivos', icon: 'folder-heart', link: 'files' } as NavItem] : []),
      ...(can('VIEW_STUDENTS') ? [{ label: 'Alumnos', icon: 'users', link: 'students' } as NavItem] : []),
      ...(can('VIEW_TEACHERS') ? [{ label: 'Docentes', icon: 'school', link: 'teachers' } as NavItem] : []),
      ...(can('VIEW_ASSIGNMENTS') ? [{ label: 'Asignaciones', icon: 'bookmark', link: 'assignments' } as NavItem] : []),
      ...(can('VIEW_CLASS_GROUPS') ? [{ label: 'Grupos', icon: 'users', link: 'groups' } as NavItem] : []),
      { label: 'Tienda', icon: 'store', link: this.storeLink(), count: cart, tone: 'action' },
      ...(can('MANAGE_STORE') && this.store.currentSchool()?.slug
        ? [{ label: 'Administrar tienda', icon: 'archive', link: this.storeAdminLink() } as NavItem]
        : []),
      ...(can('COMMUNICATION_VIEW')
        ? [
            {
              label: 'Canales',
              icon: 'megaphone',
              link: 'communication/channels',
              count: unread?.channels,
              tone: 'new',
            } as NavItem,
          ]
        : []),
      ...(can('COMMUNICATION_DIRECT') && !this.auth.isStudent()
        ? [
            {
              label: 'Mensajes directos',
              icon: 'message-circle',
              link: 'communication/direct',
              count: unread?.direct,
              tone: 'new',
            } as NavItem,
          ]
        : []),
      // COM-003 FR .20
      ...(this.auth.isAdmin()
        ? [{ label: 'Conversaciones reportadas', icon: 'flag', link: 'communication/direct-reports' } as NavItem]
        : []),
    ];

    const sections: NavSection[] = [{ items: general }];
    if (this.auth.isStudent()) {
      sections.push({
        title: 'Estudiante',
        items: [
          { label: 'Agenda', icon: 'calendar', link: 'student/schedule' },
          { label: 'Entregas', icon: 'file-up', link: 'student/assignments' },
          { label: 'Asistencia', icon: 'clipboard-check', link: 'student/attendance' },
        ],
      });
    }
    if (this.auth.isParent()) {
      sections.push({
        title: 'Padres',
        items: [
          { label: 'Portal', icon: 'users-round', link: 'parent/portal' },
          { label: 'Progreso', icon: 'chart-column', link: 'parent/progress' },
          ...(can('VIEW_FINANCIALS')
            ? [{ label: 'Estado de cuenta', icon: 'wallet', link: 'parent/finances' } as NavItem]
            : []),
        ],
      });
    }
    if (this.auth.isTeacher()) {
      sections.push({
        title: 'Docentes',
        items: [
          { label: 'Asistencia', icon: 'clipboard-check', link: 'teacher/attendance' },
          { label: 'Libro de calificaciones', icon: 'star', link: 'teacher/gradebook' },
          { label: 'Reportes', icon: 'chart-line', link: 'teacher/reports' },
        ],
      });
    }
    if (this.auth.isAdmin()) {
      sections.push({ title: 'Administración', items: [{ label: 'Administración', icon: 'settings', link: 'admin' }] });
    }
    if (this.isFinanceStaff()) {
      sections.push({
        title: 'Finanzas',
        items: [{ label: 'Cuentas y cobros', icon: 'landmark', link: 'financial-module' }],
      });
    }
    return sections;
  });

  protected readonly notificationsItem = computed(
    (): NavItem => ({
      label: 'Notificaciones',
      icon: 'bell',
      link: 'notifications',
      count: this.notifications.unread.hasValue() ? this.notifications.unread.value() : 0,
      tone: 'new',
    }),
  );

  constructor() {
    afterRenderEffect(() => {
      const schools = this.schoolsList();
      if (schools.length && !this.store.currentSchool()) {
        this.pickSchool(schools[0]);
      }
    });
    // The popover is anchored for one layout; close it when the rail expands or collapses.
    effect(() => {
      this.compact();
      untracked(() => this.switcherOpen.set(false));
    });
  }

  protected toggleSwitcher(): void {
    this.query.set('');
    this.switcherOpen.update((open) => !open);
  }

  /** `restoreFocus` when closed from inside the popover (Escape), so keyboard users land back on the crest. */
  protected closeSwitcher(restoreFocus = false): void {
    if (!this.switcherOpen()) return;
    this.switcherOpen.set(false);
    if (restoreFocus) this.schoolButton()?.nativeElement.focus();
  }

  protected focusCurrentSchool(): void {
    afterNextRender(
      () => {
        const panel = this.switcherPanel()?.nativeElement;
        const target =
          panel?.querySelector<HTMLElement>('#sidebar-school-search') ??
          panel?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]') ??
          panel?.querySelector<HTMLElement>('[role="option"]');
        target?.focus();
      },
      { injector: this.#elementInjector },
    );
  }

  protected moveFocus(event: Event, delta: 1 | -1): void {
    event.preventDefault();
    const panel = this.switcherPanel()?.nativeElement;
    if (!panel) return;
    const options = Array.from(panel.querySelectorAll<HTMLElement>('[role="option"]'));
    if (!options.length) return;
    const i = options.indexOf(document.activeElement as HTMLElement);
    const next = i === -1 ? (delta === 1 ? 0 : options.length - 1) : (i + delta + options.length) % options.length;
    options[next].focus();
  }

  protected chooseSchool(school: SidebarSchool): void {
    this.pickSchool(school);
    this.closeSwitcher(true);
  }

  protected cycleTheme(): void {
    const i = THEMES.findIndex((t) => t.value === this.theme.theme());
    this.theme.setTheme(THEMES[(i + 1) % THEMES.length].value);
  }

  protected pickSchool(school: SidebarSchool) {
    this.store.currentSchool.set({ ...school, slug: school.slug ?? null } as CurrentSchool);
  }

  protected logout() {
    this.#confirmation
      .confirm({
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que quieres cerrar sesión?',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.auth.logout();
        }
      });
  }
}
