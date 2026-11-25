import { Badge, BrandLogo, Button, Confirmation, Icon } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, computed, EnvironmentInjector, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, map, of, switchMap, timer } from 'rxjs';
import Auth from '../auth/auth';
import Store, { CurrentSchool } from './store';
import { CommunicationApi } from '../communication/communication-api';
import { NotificationsBadge } from '../notifications/notifications-badge';
import { ThemeService } from './theme.service';

type SidebarSchool = {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [Badge, Button, BrandLogo, RouterLink, RouterLinkActive, Icon],
  template: `<div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-5 shrink-0">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        <ui-brand-logo class="h-8" />
      </h1>
    </div>
    <!-- School selector -->
    @if (schoolsList.length) {
      <div class="px-3 pb-3 shrink-0">
        <div class="dropdown w-full">
          <div
            role="button"
            tabindex="0"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-2 group cursor-pointer text-ink"
          >
            @if (store.currentSchool()?.logoUrl) {
              <img
                [src]="$safeNavigationMigration(store.currentSchool()?.logoUrl)"
                [alt]="$safeNavigationMigration(store.currentSchool()?.name)"
                class="min-w-6 max-w-10 h-6 rounded object-contain"
              />
            } @else {
              <ui-icon name="building-2" class="text-xl" />
            }
            <span class="flex-1 truncate text-sm">{{ store.currentSchool()?.name }}</span>
            <ui-icon name="chevron-down" class="text-lg opacity-70" />
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu bg-surface-1 rounded-box z-50 w-full max-w-56 p-2 shadow-lg border border-line"
          >
            @for (school of schoolsList; track school.id) {
              <li>
                <div
                  (click)="pickSchool(school)"
                  (keydown)="pickSchool(school)"
                  tabindex="0"
                  class="flex items-center gap-2"
                >
                  @if (school.logoUrl) {
                    <img [src]="school.logoUrl" [alt]="school.name" class="w-5 h-5 rounded object-contain" />
                  } @else {
                    <ui-icon name="building-2" class="text-lg" />
                  }
                  <span>{{ school.name }}</span>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    }
    <nav class="px-3 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
      <!-- General Section -->
      <ul class="space-y-0.5">
        <li>
          <a
            routerLink="home"
            routerLinkActive="bg-action-subtle text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
          >
            <ui-icon name="house" class="text-xl" />
            <span>Inicio</span>
          </a>
        </li>
        @if (auth.hasPermission('VIEW_COURSES')) {
          <li>
            <a
              routerLink="courses"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="book-open" class="text-xl" />
              <span>Cursos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_FILES')) {
          <li>
            <a
              routerLink="files"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="folder-heart" class="text-xl" />
              <span>Archivos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_STUDENTS')) {
          <li>
            <a
              routerLink="students"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="users" class="text-xl" />
              <span>Alumnos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_TEACHERS')) {
          <li>
            <a
              routerLink="teachers"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="school" class="text-xl" />
              <span>Docentes</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_ASSIGNMENTS')) {
          <li>
            <a
              routerLink="assignments"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="bookmark" class="text-xl" />
              <span>Asignaciones</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_CLASS_GROUPS')) {
          <li>
            <a
              routerLink="groups"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="users" class="text-xl" />
              <span>Grupos</span>
            </a>
          </li>
        }

        <li>
          <a
            [routerLink]="storeLink()"
            routerLinkActive="bg-action-subtle text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
          >
            <ui-icon name="store" class="text-xl" />
            <span>Tienda</span>
            @if (storeCartCount.value(); as cnt) {
              @if (cnt > 0) {
                <span uiBadge tone="action" size="sm" class="ml-auto">{{ cnt > 99 ? '99+' : cnt }}</span>
              }
            }
          </a>
        </li>

        @if (auth.hasPermission('MANAGE_STORE') && store.currentSchool()?.slug) {
          <li>
            <a
              [routerLink]="storeAdminLink()"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="archive" class="text-xl" />
              <span>Administrar tienda</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('COMMUNICATION_VIEW')) {
          <li>
            <a
              routerLink="communication/channels"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="megaphone" class="text-xl" />
              <span>Canales</span>
              @if (unread.value().channels; as count) {
                <span uiBadge tone="new" size="sm" class="ml-auto">{{ count > 99 ? '99+' : count }}</span>
              }
            </a>
          </li>
        }
        @if (auth.hasPermission('COMMUNICATION_DIRECT') && !auth.isStudent()) {
          <li>
            <a
              routerLink="communication/direct"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="message-circle" class="text-xl" />
              <span>Mensajes directos</span>
              @if (unread.value().direct; as count) {
                <span uiBadge tone="new" size="sm" class="ml-auto">{{ count > 99 ? '99+' : count }}</span>
              }
            </a>
          </li>
        }
        @if (auth.isAdmin()) {
          <!-- COM-003 FR .20 -->
          <li>
            <a
              routerLink="communication/direct-reports"
              routerLinkActive="bg-action-subtle text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
            >
              <ui-icon name="flag" class="text-xl" />
              <span>Conversaciones reportadas</span>
            </a>
          </li>
        }
      </ul>

      <!-- Student Section -->
      @if (auth.isStudent()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">Estudiante</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="student/schedule"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="calendar" class="text-xl" />
                <span>Agenda</span>
              </a>
            </li>
            <li>
              <a
                routerLink="student/assignments"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="file-up" class="text-xl" />
                <span>Entregas</span>
              </a>
            </li>
            <li>
              <a
                routerLink="student/attendance"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="clipboard-check" class="text-xl" />
                <span>Asistencia</span>
              </a>
            </li>
          </ul>
        </div>
      }

      <!-- Parent Section -->
      @if (auth.isParent()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">Padres</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="parent/portal"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="users-round" class="text-xl" />
                <span>Portal</span>
              </a>
            </li>
            <li>
              <a
                routerLink="parent/progress"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="chart-column" class="text-xl" />
                <span>Progreso</span>
              </a>
            </li>
            @if (auth.hasPermission('VIEW_FINANCIALS')) {
              <li>
                <a
                  routerLink="parent/finances"
                  routerLinkActive="bg-action-subtle text-primary font-semibold"
                  class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
                >
                  <ui-icon name="wallet" class="text-xl" />
                  <span>Estado de cuenta</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Teacher Section -->
      @if (auth.isTeacher()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">Docentes</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="teacher/attendance"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="clipboard-check" class="text-xl" />
                <span>Asistencia</span>
              </a>
            </li>
            <li>
              <a
                routerLink="teacher/gradebook"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="star" class="text-xl" />
                <span>Libro de calificaciones</span>
              </a>
            </li>
            <li>
              <a
                routerLink="teacher/reports"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="chart-line" class="text-xl" />
                <span>Reportes</span>
              </a>
            </li>
          </ul>
        </div>
      }

      <!-- Admin Section -->
      @if (auth.isAdmin()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">Administración</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="admin"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="settings" class="text-xl" />
                <span>Administración</span>
              </a>
            </li>
          </ul>
        </div>
      }

      @if (auth.isAdmin() || auth.isStudent()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">Finanzas</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="financial-module"
                routerLinkActive="bg-action-subtle text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group"
              >
                <ui-icon name="landmark" class="text-xl" />
                <span>Panel de financiero</span>
              </a>
            </li>
          </ul>
        </div>
      }
    </nav>
    <!-- User section at bottom -->
    <div class="shrink-0 p-3 border-t border-line space-y-2">
      <a
        routerLink="notifications"
        routerLinkActive="bg-action-subtle text-primary font-semibold"
        class="flex items-center gap-3 px-3 py-2 text-ink rounded-lg transition-all duration-150 hover:bg-surface-2 hover:text-ink-strong group w-full"
      >
        <ui-icon name="bell" class="text-xl" />
        <span>Notificaciones</span>
        @if (notifications.unread.hasValue() && notifications.unread.value(); as count) {
          <span uiBadge tone="new" size="sm" class="ml-auto" [attr.aria-label]="count + ' sin leer'">{{ count > 99 ? '99+' : count }}</span>
        }
      </a>
      <div class="flex gap-1 p-2 rounded-lg bg-surface-0/50" role="group" aria-label="Tema">
        <button
          uiButton
          size="sm"
          iconOnly
          type="button"
          (click)="theme.setTheme('light')"
          [variant]="theme.theme() === 'light' ? 'primary' : 'ghost'"
          [attr.aria-pressed]="theme.theme() === 'light'"
          title="Claro"
          aria-label="Claro"
        >
          <ui-icon name="sun" class="text-lg" />
        </button>
        <button
          uiButton
          size="sm"
          iconOnly
          type="button"
          (click)="theme.setTheme('dark')"
          [variant]="theme.theme() === 'dark' ? 'primary' : 'ghost'"
          [attr.aria-pressed]="theme.theme() === 'dark'"
          title="Oscuro"
          aria-label="Oscuro"
        >
          <ui-icon name="moon" class="text-lg" />
        </button>
        <button
          uiButton
          size="sm"
          iconOnly
          type="button"
          (click)="theme.setTheme('system')"
          [variant]="theme.theme() === 'system' ? 'primary' : 'ghost'"
          [attr.aria-pressed]="theme.theme() === 'system'"
          title="Sistema"
          aria-label="Sistema"
        >
          <ui-icon name="sun-moon" class="text-lg" />
        </button>
      </div>
      <div class="dropdown dropdown-top w-full">
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 group cursor-pointer w-full"
        >
          <div
            class="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            [style.background]="auth.userColor()"
          >
            @if (avatarUrl.value()) {
              <img [src]="avatarUrl.value()" [alt]="auth.userName()" class="w-full h-full object-cover" />
            } @else {
              <span class="text-neutral-content text-sm font-medium">{{ auth.userInitials() }}</span>
            }
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium truncate">{{ auth.userName() }}</p>
            <p class="text-xs text-ink-muted truncate">Ver perfil</p>
          </div>
          <ui-icon name="chevron-up" class="text-lg opacity-70" />
        </div>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-surface-1 rounded-box z-50 w-full max-w-56 p-2 shadow-lg border border-line mb-2"
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
    </div>
  </div>`,
})
export class Sidebar {
  protected readonly auth = inject(Auth);
  protected readonly store = inject(Store);
  protected readonly theme = inject(ThemeService);

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
  protected get schoolsList(): SidebarSchool[] {
    const s = this.schools.hasValue() ? this.schools.value() : undefined;
    return Array.isArray(s) ? s : [];
  }

  constructor() {
    afterRenderEffect(() => {
      const schools = this.schoolsList;
      if (schools.length && !this.store.currentSchool()) {
        this.pickSchool(schools[0]);
      }
    });
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
