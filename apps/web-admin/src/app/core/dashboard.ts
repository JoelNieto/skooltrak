import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from './sidebar';
import { Button, Icon } from '#/ui';
@Component({
  selector: 'app-dashboard',
  imports: [Button, RouterOutlet, Sidebar, Icon],

  template: ` <div class="flex h-screen overflow-hidden">
    <!-- Mobile sidebar overlay -->
    <div
      #sidebarOverlay
      id="sidebar-overlay"
      class="fixed inset-0 bg-surface-0/60 backdrop-blur-md z-40 lg:hidden hidden"
      (click)="closeSidebar()"
      (keydown)="closeSidebar()"
      tabindex="0"
    ></div>

    <!-- Mobile sidebar toggle -->
    <div class="w-full fixed top-0 z-30 flex items-center px-2 lg:hidden bg-surface-0">
      <button
        uiButton
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

    <!-- Sidebar -->
    <aside
      #sidebar
      id="sidebar"
      appSidebar
      class="fixed flex flex-col lg:relative z-50 w-64 h-screen bg-surface-1 border-r border-line transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
    ></aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden lg:pt-0 pt-8">
      <!-- Page content -->
      <main class="flex-1 overflow-y-auto px-4 bg-surface-1">
        <div class="mx-auto">
          <router-outlet />
        </div>
      </main>
    </div>
  </div>`,
})
export default class Dashboard {
  public sidebarOverlay = viewChild.required<ElementRef<HTMLDivElement>>('sidebarOverlay');

  public sidebar = viewChild.required<Sidebar, ElementRef>('sidebar', {
    read: ElementRef,
  });

  public sidebarToggle = viewChild.required('sidebarToggle', { read: ElementRef<HTMLElement> });

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
