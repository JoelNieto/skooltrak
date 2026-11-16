import { afterRenderEffect, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import Auth from '../auth/auth';
import { SchoolThemeService } from './school-theme.service';
import { Sidebar } from './sidebar';
import { ThemeService } from './theme.service';
import { Button, Icon } from '#/ui';
@Component({
  selector: 'app-dashboard',
  imports: [Button, RouterOutlet, Sidebar, Icon],
  viewProviders: [],
  template: `<div class="flex h-screen overflow-hidden">
    <!-- Mobile sidebar overlay -->
    <div
      #sidebarOverlay
      id="sidebar-overlay"
      class="fixed inset-0 bg-surface-0/60 backdrop-blur-md z-40 lg:hidden hidden"
      (click)="closeSidebar()"
      (keydown)="closeSidebar()"
      tabindex="0"
    ></div>

    <!-- Sidebar -->
    <aside
      #sidebar
      id="sidebar"
      appSidebar
      class="fixed flex flex-col lg:relative z-50 w-64 h-screen bg-surface-1 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
    ></aside>
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Mobile menu toggle only -->
      <div id="mobile-menu-bar" class="lg:hidden shrink-0 p-2 print:hidden">
        <button
          uiButton
          variant="ghost"
          size="sm"
          #sidebarToggle
          id="sidebar-toggle"
          class="border-none"
          (click)="openSidebar()"
          (keydown)="openSidebar()"
          tabindex="0"
        >
          <ui-icon name="menu" />
        </button>
      </div>
      <!-- Page content -->
      <main class="ui-page flex-1 overflow-y-auto">
        <div class="mx-auto pt-2">
          <router-outlet />
        </div>
      </main>
    </div>
  </div> `,
})
export default class Dashboard {
  public sidebarOverlay = viewChild.required<ElementRef<HTMLDivElement>>('sidebarOverlay');

  public sidebar = viewChild.required<Sidebar, ElementRef>('sidebar', {
    read: ElementRef,
  });

  public sidebarToggle = viewChild.required('sidebarToggle', { read: ElementRef<HTMLElement> });

  #router = inject(Router);
  #theme = inject(ThemeService);
  #auth = inject(Auth);
  #destroyRef = inject(DestroyRef);
  public schoolTheme = inject(SchoolThemeService);
  constructor() {
    afterRenderEffect(() => {
      const pref = this.#auth.themePreference();
      if (pref) {
        this.#theme.applyTheme(pref);
      }
    });
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(() => {
        this.closeSidebar();
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
}
