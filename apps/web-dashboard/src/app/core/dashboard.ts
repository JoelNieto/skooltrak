import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  OnInit,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorListDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import Auth from '../auth/auth';
import { Sidebar } from './sidebar';
import Store from './store';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, NgIcon],
  viewProviders: [provideIcons({ phosphorListDuotone })],
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
    <div class="w-full fixed top-0 z-30 flex items-center px-2 lg:hidden">
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
      class="fixed flex flex-col lg:relative z-50 w-64 h-screen bg-base-100  dark:border-white/10 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
    ></aside>
    <div class="flex-1 flex flex-col overflow-hidden lg:pt-0 pt-8">
      <!-- Page content -->
      <main class="flex-1 overflow-y-auto px-4">
        <div class="mx-auto pt-4">
          <router-outlet />
        </div>
      </main>
    </div>
  </div> `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard implements OnInit {
  public sidebarOverlay =
    viewChild.required<ElementRef<HTMLDivElement>>('sidebarOverlay');

  public sidebar = viewChild.required<Sidebar, ElementRef>('sidebar', {
    read: ElementRef,
  });

  public sidebarToggle =
    viewChild.required<ElementRef<HTMLElement>>('sidebarToggle');

  public store = inject(Store);
  private apollo = inject(Apollo);
  private injector = inject(Injector);
  public auth = inject(Auth);

  ngOnInit(): void {
    this.apollo
      .watchQuery<{
        me: Prisma.UserGetPayload<{
          include: {
            role: { include: { permissions: true } };
            teacher: true;
            student: true;
          };
        }>;
      }>({
        query: gql`
          query me {
            me {
              id
              email
              firstName
              lastName
              teacher {
                id
                firstName
                fatherName
              }
              student {
                id
                firstName
                fatherName
              }
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
