import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Sidebar } from './sidebar';
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar],
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
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Mobile menu toggle only -->
      <div id="mobile-menu-bar" class="lg:hidden shrink-0 p-2 print:hidden">
        <button
          #sidebarToggle
          id="sidebar-toggle"
          class="btn btn-sm btn-ghost border-none"
          (click)="openSidebar()"
          (keydown)="openSidebar()"
          tabindex="0"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
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

  #router = inject(Router);

  constructor() {
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
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
