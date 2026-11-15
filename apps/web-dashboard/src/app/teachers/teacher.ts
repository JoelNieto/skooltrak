import { Badge, Breadcrumbs, Button, Card, CardBody, Loader } from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TeacherView = any;

@Component({
  imports: [Breadcrumbs, Badge, Card, CardBody, Button, Loader, RouterLink, DatePipe],
  template: `@defer {
      @if (teacherResource.hasValue() && teacherResource.value()?.id) {
        @let teacher = teacherResource.value()!;
        <ui-breadcrumbs
          [items]="[{ label: 'Inicio', link: '/' }, { label: 'Docentes', link: '/teachers' }, { label: teacher.name }]"
        />
        <div uiCard class="mt-4">
          <div uiCardBody class="flex flex-row justify-between items-center">
            <div class="flex gap-2 items-center ">
              <div class="avatar avatar-placeholder">
                @if (avatarUrl()) {
                  <div class="w-12 rounded-full overflow-hidden">
                    <img [src]="avatarUrl()!" [alt]="teacher.name" class="w-full h-full object-cover" />
                  </div>
                } @else {
                  <div class="text-white w-12 rounded-full" [style.background]="teacher.user?.color">
                    <span class="text-lg">{{ teacher.initials }}</span>
                  </div>
                }
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  {{ teacher.name }}
                  @if (teacher.user?.emailVerified) {
                    <span uiBadge tone="success" size="sm" class="gap-1">
                      <span class="material-symbols-outlined text-sm!">check_circle</span>
                      Verificado
                    </span>
                  } @else {
                    <span uiBadge tone="warning" size="sm" class="gap-1">
                      <span class="material-symbols-outlined text-sm!">schedule</span>
                      Pendiente
                    </span>
                  }
                </div>
                <span class="text-sm text-ink-subtle">{{ teacher.user?.email }}</span>
              </div>
            </div>
            <div class="flex gap-2 items-center">
              @if (auth.hasPermission('MANAGE_TEACHERS')) {
                <a uiButton size="sm" routerLink="edit"> <span class="material-symbols-outlined">edit</span></a>
              }
              <button uiButton variant="primary" size="sm"><span class="material-symbols-outlined">chat</span></button>
            </div>
          </div>
        </div>
        <div class="tabs tabs-box mt-4">
          <input class="tab" type="radio" name="teacher_tabs" aria-label="Información Personal" checked="checked" />
          <div class="tab-content bg-surface-1 border-line p-4">
            <div>
              <div class="px-4 sm:px-0">
                <h3 class="text-base/7 font-semibold">Información Personal</h3>
                <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Detalles personales y de contacto</p>
              </div>
              <div class="mt-6 border-t border-line">
                <dl class="divide-y divide-line">
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Nombre completo</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.fullName }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Documento de identidad</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.documentId }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Fecha de nacimiento</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.birthDate | date: 'dd/MM/yyyy' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Género</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.gender === 'MALE' ? 'Masculino' : 'Femenino' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Dirección</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.address || 'No especificada' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Teléfono</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.phoneNumber || 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Correo personal</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.personalEmail || 'No especificado' }}
                    </dd>
                  </div>
                  @if (teacher.about) {
                    <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt class="text-sm/6 font-medium text-ink-strong">Acerca de</dt>
                      <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                        {{ teacher.about }}
                      </dd>
                    </div>
                  }
                </dl>
              </div>
            </div>
          </div>

          <input class="tab" type="radio" name="teacher_tabs" aria-label="Información Académica" />
          <div class="tab-content bg-surface-1 border-line p-4">
            <div>
              <div class="px-4 sm:px-0">
                <h3 class="text-base/7 font-semibold">Información Académica</h3>
                <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Materias, cursos y grupos asignados</p>
              </div>
              <div class="mt-6 border-t border-line">
                <dl class="divide-y divide-line">
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Docente desde</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.teacherSince || 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Miembro desde</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      {{ teacher.memberSince ? (teacher.memberSince | date: 'dd/MM/yyyy') : 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Materias</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (subject of teacher.subjects; track subject.id) {
                          <span uiBadge>
                            {{ subject.name }}
                          </span>
                        } @empty {
                          <span class="text-sm/6 text-ink-muted"> No hay materias asignadas </span>
                        }
                      </div>
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Cursos</dt>
                    <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (course of teacher.courses; track course.id) {
                          <a uiBadge tone="action" [routerLink]="['/courses', course.id]">
                            {{ course.name }}
                          </a>
                        } @empty {
                          <span class="text-sm/6 text-ink-muted"> No hay cursos asignados </span>
                        }
                      </div>
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-ink-strong">Grupos</dt>
                    <dd class="mt-2 text-sm text-ink sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (group of teacher.classGroups; track group.id) {
                          <a uiBadge [routerLink]="['/groups', group.id]">
                            {{ group.name }}
                          </a>
                        } @empty {
                          <span class="text-sm/6 text-ink-muted"> No hay grupos asignados </span>
                        }
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div>No se encontró el docente</div>
      }
    } @placeholder (minimum 1s) {
      <lib-loader />
    } @loading (after 100ms; minimum 1s) {
      <lib-loader />
    }`,
})
export default class Teacher {
  public id = input.required<string>();
  public auth = inject(Auth);
  public teacherResource = httpResource<TeacherView>(() => {
    if (!isValidId(this.id())) {
      return undefined;
    }
    return { url: `/api/v1/teachers/${this.id()}` };
  });

  public avatarResource = httpResource<{ url: string | null }>(() => {
    const user = this.teacherResource.value()?.user;
    if (!user?.id) {
      return undefined;
    }
    return { url: `/api/v1/users/${user.id}/presigned-avatar-url` };
  });

  public avatarUrl = computed(() => this.avatarResource.value()?.url ?? null);
}
