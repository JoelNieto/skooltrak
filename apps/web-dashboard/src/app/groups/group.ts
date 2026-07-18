import { Loader, Toast } from '#/ui';
import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { httpResource, HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ChatType } from '@generated/prisma';
import { firstValueFrom } from 'rxjs';
import { isValidId } from '../core/validators';
import Auth from '../auth/auth';
import GroupCourses from './group-courses';
import GroupHabits from './group-habits';
import GroupSchedule from './group-schedule';
import GroupStudents from './group-students';

@Component({
  imports: [RouterLink, Loader, GroupStudents, GroupCourses, GroupSchedule, GroupHabits],
  viewProviders: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @let group = groupResource.value(); @if(groupResource.isLoading()) {
    <lib-loader />
    } @else { @if(group && group.id) {
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/groups">Grupos</a></li>
        <li>{{ group.name }}</li>
      </ul>
    </div>
    <div class="card card-border border-base-300 bg-base-100">
      <div class="card-body flex flex-row justify-between items-center">
        <div>
          <h1 class="text-xl  font-semibold">{{ group.name }}</h1>
          <h3 class="text-base-200">
            {{ group.studyPlan?.name }} / {{ group.studyPlan?.degree?.name }}
          </h3>
          <div class="flex items-center gap-2">
            <div class="avatar avatar-placeholder">
              <div
                class="text-white w-7 rounded-full"
                [style.background]="group.teacher?.color"
              >
                <span class="text-xs">{{ group.teacher?.initials }}</span>
              </div>
            </div>
            {{ group.teacher?.name }}
          </div>
        </div>
        @if (canStartGroupChat()) {
          <button
            class="btn btn-ghost btn-sm"
            (click)="startGroupChat()"
            [disabled]="startingChat()"
          >
            @if (startingChat()) {
              <span class="loading loading-spinner loading-sm"></span>
            } @else {
              <span class="material-symbols-outlined">chat</span>
            }
            Chat
          </button>
        }
      </div>
    </div>

    <div class="tabs tabs-box mt-4">
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" checked />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">group</span>
          Estudiantes</span
        >
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-students [students]="$any(group.students ?? [])" />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">menu_book</span>
          Cursos
        </span>
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-courses [courses]="$any(group.courses ?? [])" />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">calendar_month</span>
          Horario
        </span>
      </label>
      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-schedule [id]="id()" />
      </div>
      @if (canManageHabits()) {
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">psychology</span>
          Hábitos y actitudes
        </span>
      </label>
      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-habits [groupId]="id()" [students]="$any(group.students ?? [])" />
      </div>
      }
    </div>
    } @else {
    <div>No group found</div>
    } }
  `,
})
export default class Group {
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
