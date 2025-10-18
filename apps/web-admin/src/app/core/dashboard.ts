import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorListDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { Auth } from '../auth/auth';
import { Sidebar } from './sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, NgIcon],
  viewProviders: [provideIcons({ phosphorListDuotone })],
  template: ` <div class="flex h-screen overflow-hidden">
    <!-- Mobile sidebar overlay -->
    <div
      #sidebarOverlay
      id="sidebar-overlay"
      class="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md z-40 lg:hidden hidden"
      (click)="closeSidebar()"
      (keydown)="closeSidebar()"
      tabindex="0"
    ></div>

    <!-- Mobile sidebar toggle -->
    <div
      class="w-full fixed top-0 z-30 flex items-center px-2 lg:hidden bg-base-200"
    >
      <button
        #sidebarToggle
        id="sidebar-toggle"
        class="btn btn-primary btn-outline border-none"
        (click)="openSidebar()"
        (keydown)="openSidebar()"
        tabindex="0"
      >
        <ng-icon name="phosphorListDuotone" />
      </button>
    </div>

    <!-- Sidebar -->
    <aside
      #sidebar
      id="sidebar"
      appSidebar
      class="fixed flex flex-col lg:relative z-50 w-64 h-screen bg-base-100 border-r border-neutral-300 dark:border-white/10 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
    ></aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden lg:pt-0 pt-8">
      <!-- Page content -->
      <main class="flex-1 overflow-y-auto px-4 bg-base-100">
        <div class="mx-auto">
          <router-outlet />
        </div>
      </main>
    </div>
  </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private apollo = inject(Apollo);
  private auth = inject(Auth);

  public sidebarOverlay =
    viewChild.required<ElementRef<HTMLDivElement>>('sidebarOverlay');

  public sidebar = viewChild.required<Sidebar, ElementRef>('sidebar', {
    read: ElementRef,
  });

  public sidebarToggle =
    viewChild.required<ElementRef<HTMLElement>>('sidebarToggle');

  ngOnInit() {
    this.apollo
      .watchQuery<{
        me: Prisma.UserGetPayload<{
          include: { role: { include: { permissions: true } } };
        }>;
      }>({
        query: gql`
          query me {
            me {
              id
              email
              firstName
              lastName
              role {
                name
                permissions {
                  id
                  descriptiveId
                  description
                }
              }
            }
          }
        `,
      })
      .valueChanges.subscribe((res) => {
        console.log(res.data);
        const { me } = res.data;
        if (me) {
          this.auth.user.set(me);
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
}
