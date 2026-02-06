import { Confirmation } from '@/ui';
import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Prisma } from '@generated/prisma';

import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import { Sidebar } from './sidebar';
import Store from './store';
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, RouterLink],
  viewProviders: [],
  template: `<div class="flex h-screen overflow-hidden">
    <!-- Mobile sidebar overlay -->
    <div
      #sidebarOverlay
      id="sidebar-overlay"
      class="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md z-40 lg:hidden hidden"
      (click)="closeSidebar()"
      (keydown)="closeSidebar()"
      tabindex="0"
    ></div>

    <!-- Sidebar -->
    <aside
      #sidebar
      id="sidebar"
      appSidebar
      class="fixed flex flex-col lg:relative z-50 w-64 h-screen bg-base-100 border-r border-neutral-200 dark:border-white/10 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
    ></aside>
    <div class="flex-1 flex flex-col overflow-hidden pt-0">
      <div
        class="p-4 border-b border-neutral-200 dark:border-white/10 sticky top-0 z-10 flex justify-between items-center"
      >
        <div class="flex gap-2 items-center">
          <button
            #sidebarToggle
            id="sidebar-toggle"
            class="btn btn-sm btn-ghost border-none lg:hidden"
            (click)="openSidebar()"
            (keydown)="openSidebar()"
            tabindex="0"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>
          <div class="dropdown w-full">
            <div
              role="button"
              tabindex="0"
              class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group cursor-pointer"
            >
              @if (store.currentSchool()?.logoUrl) {
                <img
                  [src]="store.currentSchool()?.logoUrl"
                  [alt]="store.currentSchool()?.name"
                  class="min-w-6 max-w-12 h-6 rounded object-contain"
                />
              } @else {
                <span class="material-symbols-outlined text-xl">apartment</span>
              }
              <span class="ml-2">{{ store.currentSchool()?.name }}</span>
            </div>
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm cursor-pointer"
            >
              @for (school of schools.value(); track school.id) {
                <li>
                  <div
                    (click)="store.currentSchool.set(school)"
                    (keydown)="store.currentSchool.set(school)"
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
        <div class="flex items-center gap-4">
          <a routerLink="messages" class="btn btn-ghost relative">
            <span class="material-symbols-outlined text-2xl">mail_outline</span>
            @if (unreadCount.value(); as count) {
              @if (count > 0) {
                <span class="badge badge-primary badge-sm absolute -top-1 -right-1">{{
                  count > 99 ? '99+' : count
                }}</span>
              }
            }
          </a>
          <div class="dropdown dropdown-end">
            <div class="avatar avatar-placeholder cursor-pointer" role="button" tabindex="0">
              <div class="text-neutral-content w-8 rounded-full" [style.background]="auth.userColor()">
                <span>{{ auth.userInitials() }}</span>
              </div>
            </div>
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-1 w-64 p-2 shadow-sm cursor-pointer "
            >
              <span class="text-neutral-400 text-medium px-2 mb-3">{{ auth.userName() }}</span>
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
      </div>
      <!-- Page content -->
      <main class="flex-1 overflow-y-auto px-4 bg-base-200">
        <div class="mx-auto pt-2">
          <router-outlet />
        </div>
      </main>
    </div>
  </div> `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard {
  public sidebarOverlay = viewChild.required<ElementRef<HTMLDivElement>>('sidebarOverlay');

  public sidebar = viewChild.required<Sidebar, ElementRef>('sidebar', {
    read: ElementRef,
  });

  public sidebarToggle = viewChild.required<ElementRef<HTMLElement>>('sidebarToggle');

  public store = inject(Store);
  private apollo = inject(Apollo);
  public auth = inject(Auth);
  #confirmation = inject(Confirmation);
  public schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          schools: (Prisma.SchoolGetPayload<{
            include: undefined;
          }> & { logoUrl?: string | null })[];
        }>({
          fetchPolicy: 'cache-first',
          query: gql`
            query GetSchools {
              schools {
                id
                name
                organizationId
                shortName
                logo
                logoUrl
                address
                city
                state
                zip
                country
                email
                phone
                website
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.schools)),
  });

  public unreadCount = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{ unreadMessagesCount: number }>({
          fetchPolicy: 'network-only',
          pollInterval: 60000, // Poll every minute
          query: gql`
            query UnreadMessagesCount {
              unreadMessagesCount
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.unreadMessagesCount)),
  });

  constructor() {
    afterRenderEffect(() => {
      const schools = this.schools.value();
      if (schools?.length) {
        this.store.currentSchool.set(schools[0]);
      }
    });
  }

  public openSidebar() {
    this.sidebarOverlay().nativeElement.classList.remove('hidden');
    this.sidebar().nativeElement.classList.remove('-translate-x-full');
    this.sidebarToggle().nativeElement.classList.add('hidden');
  }

  public closeSidebar() {
    this.sidebarOverlay().nativeElement.classList.add('hidden');
    this.sidebar().nativeElement.classList.add('-translate-x-full');
    this.sidebarToggle().nativeElement.classList.remove('hidden');
  }

  public logout() {
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
