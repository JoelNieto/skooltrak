import { Confirmation } from '@/ui';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import Auth from '../auth/auth';
import {
  ChatsUnreadCountDocument,
  GetSchoolsDocument,
  GetSchoolsQuery,
  MyStoreCartCountDocument,
  UnreadMessagesCountDocument,
} from '../graphql/generated/graphql';
import Store from './store';
import { ThemeService } from './theme.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive],
  template: `<div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-5 shrink-0">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8" />
      </h1>
    </div>
    <!-- School selector -->
    @if (schoolsList.length) {
      <div class="px-3 pb-3 shrink-0">
        <div class="dropdown w-full">
          <div
            role="button"
            tabindex="0"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 group cursor-pointer text-base-content/80"
          >
            @if (store.currentSchool()?.logoUrl) {
              <img
                [src]="store.currentSchool()?.logoUrl"
                [alt]="store.currentSchool()?.name"
                class="min-w-6 max-w-10 h-6 rounded object-contain"
              />
            } @else {
              <span class="material-symbols-outlined text-xl">apartment</span>
            }
            <span class="flex-1 truncate text-sm">{{ store.currentSchool()?.name }}</span>
            <span class="material-symbols-outlined text-lg opacity-70">expand_more</span>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-50 w-full max-w-56 p-2 shadow-lg border border-base-200"
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
                    <span class="material-symbols-outlined text-lg">apartment</span>
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
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">home</span>
            <span>Inicio</span>
          </a>
        </li>
        @if (auth.hasPermission('VIEW_COURSES')) {
          <li>
            <a
              routerLink="courses"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">menu_book</span>
              <span>Cursos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_FILES')) {
          <li>
            <a
              routerLink="files"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">folder_special</span>
              <span>Archivos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_STUDENTS')) {
          <li>
            <a
              routerLink="students"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">people</span>
              <span>Alumnos</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_TEACHERS')) {
          <li>
            <a
              routerLink="teachers"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">school</span>
              <span>Docentes</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_ASSIGNMENTS')) {
          <li>
            <a
              routerLink="assignments"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">bookmarks</span>
              <span>Asignaciones</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_CLASS_GROUPS')) {
          <li>
            <a
              routerLink="groups"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">groups</span>
              <span>Grupos</span>
            </a>
          </li>
        }

        <li>
          <a
            [routerLink]="storeLink()"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">storefront</span>
            <span>Tienda</span>
            @if (storeCartCount.value(); as cnt) {
              @if (cnt > 0) {
                <span class="badge badge-primary badge-sm ml-auto">{{ cnt > 99 ? '99+' : cnt }}</span>
              }
            }
          </a>
        </li>

        @if (auth.hasPermission('MANAGE_STORE') && store.currentSchool()?.slug) {
          <li>
            <a
              [routerLink]="storeAdminLink()"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">inventory_2</span>
              <span>Administrar tienda</span>
            </a>
          </li>
        }
        @if (auth.hasPermission('VIEW_MESSAGES')) {
          <li>
            <a
              routerLink="messages"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">mail</span>
              <span>Mensajes</span>
            </a>
          </li>
          <li>
            <a
              routerLink="chats"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">chat</span>
              <span>Chats</span>
              @if (chatUnreadCount.value(); as count) {
                @if (count > 0) {
                  <span class="badge badge-primary badge-sm ml-auto">{{ count > 99 ? '99+' : count }}</span>
                }
              }
            </a>
          </li>
        }
      </ul>

      <!-- Student Section -->
      @if (auth.isStudent()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Estudiante</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="student/schedule"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">event</span>
                <span>Agenda</span>
              </a>
            </li>
            <li>
              <a
                routerLink="student/assignments"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">upload_file</span>
                <span>Entregas</span>
              </a>
            </li>
            <li>
              <a
                routerLink="student/notifications"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">notifications</span>
                <span>Notificaciones</span>
              </a>
            </li>
            <li>
              <a
                routerLink="student/attendance"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">fact_check</span>
                <span>Asistencia</span>
              </a>
            </li>
            @if (auth.hasPermission('VIEW_FINANCIALS')) {
              <li>
                <a
                  routerLink="student/finances"
                  routerLinkActive="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2 text-white/70 rounded-lg transition-all duration-150 hover:bg-white/10 hover:text-white group"
                >
                  <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
                  <span>Estado de cuenta</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Teacher Section -->
      @if (auth.isTeacher() || auth.isAdmin()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Docente</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="teacher/attendance"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">playlist_add_check</span>
                <span>Tomar asistencia</span>
              </a>
            </li>
            <li>
              <a
                routerLink="teacher/gradebook"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">table</span>
                <span>Libro de notas</span>
              </a>
            </li>
            <li>
              <a
                routerLink="teacher/communication"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">forum</span>
                <span>Comunicación</span>
              </a>
            </li>
            <li>
              <a
                routerLink="teacher/reports"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">assessment</span>
                <span>Reportes</span>
              </a>
            </li>
          </ul>
        </div>
      }

      <!-- Parent Section -->
      @if (auth.isParent()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Padres</p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="parent/portal"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">family_restroom</span>
                <span>Portal</span>
              </a>
            </li>
            <li>
              <a
                routerLink="parent/progress"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">bar_chart</span>
                <span>Progreso</span>
              </a>
            </li>
            <li>
              <a
                routerLink="parent/communication"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">chat</span>
                <span>Mensajes</span>
              </a>
            </li>
            <li>
              <a
                routerLink="parent/notifications"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">notifications_active</span>
                <span>Alertas</span>
              </a>
            </li>
            @if (auth.hasPermission('VIEW_FINANCIALS')) {
              <li>
                <a
                  routerLink="parent/finances"
                  routerLinkActive="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2 text-white/70 rounded-lg transition-all duration-150 hover:bg-white/10 hover:text-white group"
                >
                  <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
                  <span>Estado de cuenta</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Admin Section -->
      @if (auth.isAdmin()) {
        <div>
          <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">
            Administración
          </p>
          <ul class="space-y-0.5 mt-1">
            <li>
              <a
                routerLink="admin"
                routerLinkActive="bg-primary/10 text-primary font-semibold"
                class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
              >
                <span class="material-symbols-outlined text-xl">admin_panel_settings</span>
                <span>Panel de admin</span>
              </a>
            </li>
          </ul>
        </div>
      }
    </nav>
    <!-- User section at bottom -->
    <div class="shrink-0 p-3 border-t border-base-300 dark:border-white/10 space-y-2">
      <a
        routerLink="messages"
        class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group w-full"
      >
        <span class="material-symbols-outlined text-xl">mail_outline</span>
        <span>Mensajes</span>
        @if (unreadCount.value(); as count) {
          @if (count > 0) {
            <span class="badge badge-primary badge-sm ml-auto">{{ count > 99 ? '99+' : count }}</span>
          }
        }
      </a>
      <div class="flex gap-1 p-2 rounded-lg bg-base-200/50" role="group" aria-label="Tema">
        <button
          type="button"
          (click)="theme.setTheme('light')"
          [class.btn-active]="theme.theme() === 'light'"
          class="btn btn-ghost btn-sm btn-square"
          [attr.aria-pressed]="theme.theme() === 'light'"
          title="Claro"
        >
          <span class="material-symbols-outlined text-lg">light_mode</span>
        </button>
        <button
          type="button"
          (click)="theme.setTheme('dark')"
          [class.btn-active]="theme.theme() === 'dark'"
          class="btn btn-ghost btn-sm btn-square"
          [attr.aria-pressed]="theme.theme() === 'dark'"
          title="Oscuro"
        >
          <span class="material-symbols-outlined text-lg">dark_mode</span>
        </button>
        <button
          type="button"
          (click)="theme.setTheme('system')"
          [class.btn-active]="theme.theme() === 'system'"
          class="btn btn-ghost btn-sm btn-square"
          [attr.aria-pressed]="theme.theme() === 'system'"
          title="Sistema"
        >
          <span class="material-symbols-outlined text-lg">contrast</span>
        </button>
      </div>
      <div class="dropdown dropdown-top w-full">
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 group cursor-pointer w-full"
        >
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            [style.background]="auth.userColor()"
          >
            <span class="text-neutral-content text-sm font-medium">{{ auth.userInitials() }}</span>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium truncate">{{ auth.userName() }}</p>
            <p class="text-xs text-base-content/60 truncate">Ver perfil</p>
          </div>
          <span class="material-symbols-outlined text-lg opacity-70">expand_less</span>
        </div>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box z-50 w-full max-w-56 p-2 shadow-lg border border-base-200 mb-2"
        >
          <li><a routerLink="profile">Perfil</a></li>
          <li>
            <a routerLink="change-password">
              <span class="material-symbols-outlined text-xl">key</span>
              <span class="ml-1">Cambiar contraseña</span>
            </a>
          </li>
          <li>
            <button (click)="logout()">
              <span class="material-symbols-outlined text-xl">logout</span>
              <span class="ml-1">Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  #apollo = inject(Apollo);
  #confirmation = inject(Confirmation);

  protected schools = rxResource({
    stream: () =>
      this.#apollo
        .watchQuery({
          fetchPolicy: 'cache-first',
          query: GetSchoolsDocument,
        })
        .valueChanges.pipe(map((result) => (result.data?.schools as GetSchoolsQuery['schools']) ?? [])),
  });

  protected unreadCount = rxResource({
    stream: () =>
      this.#apollo
        .watchQuery({
          fetchPolicy: 'network-only',
          pollInterval: 60000,
          query: UnreadMessagesCountDocument,
        })
        .valueChanges.pipe(map((result) => result.data?.unreadMessagesCount ?? 0)),
  });

  protected chatUnreadCount = rxResource({
    stream: () =>
      this.#apollo
        .watchQuery({
          fetchPolicy: 'network-only',
          pollInterval: 60000,
          query: ChatsUnreadCountDocument,
        })
        .valueChanges.pipe(map((result) => result.data?.chatUnreadCount ?? 0)),
  });

  protected storeCartCount = rxResource({
    params: () => ({ schoolId: this.store.currentSchool()?.id }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of(0);
      }
      return this.#apollo
        .watchQuery({
          query: MyStoreCartCountDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'network-only',
          pollInterval: 120000,
        })
        .valueChanges.pipe(
          map((r) => (r.data?.myStoreCart ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)),
        );
    },
  });

  protected get schoolsList(): GetSchoolsQuery['schools'] {
    const s = this.schools.value();
    return Array.isArray(s) ? s : [];
  }

  constructor() {
    afterRenderEffect(() => {
      const schools = this.schools.value();
      if (schools?.length && !this.store.currentSchool()) {
        this.pickSchool(schools[0]);
      }
    });
  }

  protected pickSchool(school: GetSchoolsQuery['schools'][number]) {
    this.store.currentSchool.set({ ...school, slug: school.slug ?? null });
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
