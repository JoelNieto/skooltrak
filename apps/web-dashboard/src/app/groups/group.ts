import {
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  Loader,
  Toast,
  UiTab,
  UiTabContent,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatType } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import GroupCourses from './group-courses';
import GroupHabits from './group-habits';
import GroupSchedule from './group-schedule';
import GroupStudents from './group-students';

@Component({
  imports: [
    Breadcrumbs,
    Card,
    CardBody,
    Button,
    Loader,
    GroupStudents,
    GroupCourses,
    GroupSchedule,
    GroupHabits,
    UiTab,
    UiTabContent,
    UiTabList,
    UiTabPanel,
    UiTabs,
  ],
  template: `
    @let group = groupResource.value();
    @if (groupResource.isLoading()) {
      <lib-loader />
    } @else {
      @if (group && group.id) {
        <ui-breadcrumbs
          [items]="[{ label: 'Inicio', link: '/' }, { label: 'Grupos', link: '/groups' }, { label: group.name }]"
        />
        <div uiCard>
          <div uiCardBody class="flex flex-row justify-between items-center">
            <div>
              <h1 class="text-xl  font-semibold">{{ group.name }}</h1>
              <h3 class="text-ink-muted">{{ group.studyPlan?.name }} / {{ group.studyPlan?.degree?.name }}</h3>
              <div class="flex items-center gap-2">
                <div class="avatar avatar-placeholder">
                  <div class="text-white w-7 rounded-full" [style.background]="group.teacher?.color">
                    <span class="text-xs">{{ group.teacher?.initials }}</span>
                  </div>
                </div>
                {{ group.teacher?.name }}
              </div>
            </div>
            @if (canStartGroupChat()) {
              <button
                uiButton
                [loading]="startingChat()"
                variant="ghost"
                size="sm"
                (click)="startGroupChat()"
                [disabled]="startingChat()"
              >
                @if (!startingChat()) {
                  <span class="material-symbols-outlined">chat</span>
                }
                Chat
              </button>
            }
          </div>
        </div>

        <div uiTabs class="mt-4 flex flex-col gap-4">
          <div uiTabList [(selectedTab)]="tab" aria-label="Secciones del grupo">
            <button uiTab value="estudiantes">
              <span class="material-symbols-outlined text-xl" aria-hidden="true">group</span>
              Estudiantes
            </button>
            <button uiTab value="cursos">
              <span class="material-symbols-outlined text-xl" aria-hidden="true">menu_book</span>
              Cursos
            </button>
            <button uiTab value="horario">
              <span class="material-symbols-outlined text-xl" aria-hidden="true">calendar_month</span>
              Horario
            </button>
            @if (canManageHabits()) {
              <button uiTab value="habitos">
                <span class="material-symbols-outlined text-xl" aria-hidden="true">psychology</span>
                Hábitos y actitudes
              </button>
            }
          </div>
          <div uiTabPanel uiCard value="estudiantes" class="p-6">
            <ng-template uiTabContent>
              <app-group-students [students]="$any(group.students ?? [])" />
            </ng-template>
          </div>
          <div uiTabPanel uiCard value="cursos" class="p-6">
            <ng-template uiTabContent>
              <app-group-courses [courses]="$any(group.courses ?? [])" />
            </ng-template>
          </div>
          <div uiTabPanel uiCard value="horario" class="p-6">
            <ng-template uiTabContent>
              <app-group-schedule [id]="id()" />
            </ng-template>
          </div>
          @if (canManageHabits()) {
            <div uiTabPanel uiCard value="habitos" class="p-6">
              <ng-template uiTabContent>
                <app-group-habits [groupId]="id()" [students]="$any(group.students ?? [])" />
              </ng-template>
            </div>
          }
        </div>
      } @else {
        <div>No group found</div>
      }
    }
  `,
})
export default class Group {
  /** Selected section; the tab list and panels follow it. */
  readonly tab = signal('estudiantes');
  public id = input.required<string>();
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(Toast);
  private auth = inject(Auth);
  startingChat = signal(false);

  canStartGroupChat() {
    if (!this.auth.hasPermission('MANAGE_MESSAGES')) return false;
    const group = this.groupResource.value();
    if (!group) return false;
    return this.auth.isAdmin() || group.teacher?.user?.id === this.auth.user()?.id;
  }

  async startGroupChat() {
    this.startingChat.set(true);
    try {
      const chat = await firstValueFrom(
        this.http.post<{ id: string }>('/api/v1/chats/contextual', {
          contextType: ChatType.CLASS_GROUP,
          contextId: this.id(),
        }),
      );
      if (chat?.id) this.router.navigate(['/chats', chat.id]);
    } catch {
      this.toast.showError('Error al crear chat');
    } finally {
      this.startingChat.set(false);
    }
  }

  // Check if current user can manage habits for this group
  public canManageHabits = computed(() => {
    const user = this.auth.user();
    const group = this.groupResource.value();

    if (!user || !group) return false;

    // Allow admins
    if (this.auth.isAdmin()) return true;

    // Allow if user is the teacher of this group
    return group.teacher?.user?.id === user.id;
  });

  public groupResource = httpResource<ClassGroupDetail | null>(() =>
    isValidId(this.id()) ? `/api/v1/class-groups/${this.id()}` : undefined,
  );
}

type ClassGroupDetail = {
  id: string;
  name: string;
  studyPlan?: { name?: string; degree?: { name?: string } };
  teacher?: { name?: string; initials?: string; color?: string; user?: { id?: string } };
  students?: unknown[];
  courses?: unknown[];
};
