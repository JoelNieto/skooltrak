import { PageHeader, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LinkedChild, ParentContext } from './parent-context.service';

interface ParentMeResponse {
  id: string;
  organizationId: string;
  students: Array<{
    id: string;
    firstName: string;
    fatherName: string;
    school: { id: string; name: string; shortName: string; logo: string } | null;
    classGroup: { id: string; name: string } | null;
  }>;
}

@Component({
  selector: 'app-parent-portal',
  imports: [FormsModule, PageHeader],
  template: `
    <lib-page-header title="Portal de padres" subtitle="Resumen rápido del progreso de tus hijos." />

    <div class="mt-6 card border border-base-200 bg-base-100">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-base-content">Hijos vinculados</h2>
          <button class="btn btn-primary btn-sm" (click)="openAddChild()">
            <span class="material-symbols-outlined text-lg">add</span>
            Agregar hijo
          </button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
          </div>
        } @else if (children().length === 0) {
          <div class="py-8 text-center text-base-content/70">
            Aún no tienes hijos vinculados. Usa "Agregar hijo" con el código de matrícula.
          </div>
        } @else {
          <div class="grid gap-4 md:grid-cols-2 mt-2">
            @for (child of children(); track child.studentId) {
              <button
                class="text-left border border-base-200 rounded-lg p-4 hover:border-primary transition-colors"
                (click)="openChild(child)"
              >
                <p class="font-semibold text-base-content">{{ child.name }}</p>
                <p class="text-sm text-base-content/70">{{ child.schoolName }}</p>
                @if (child.classGroupName) {
                  <p class="text-sm text-base-content/70">Grupo: {{ child.classGroupName }}</p>
                }
              </button>
            }
          </div>
        }
      </div>
    </div>

    @if (showAddChild()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div class="card w-full max-w-md bg-base-100">
          <div class="card-body">
            <h3 class="text-lg font-semibold text-base-content">Agregar hijo</h3>
            <p class="text-sm text-base-content/70">Ingresa el código de matrícula del estudiante.</p>

            <input
              class="input input-bordered w-full mt-2 uppercase"
              placeholder="Código de matrícula"
              [(ngModel)]="addCode"
            />

            @if (addError()) {
              <p class="text-error text-sm mt-2">{{ addError() }}</p>
            }

            <div class="flex justify-end gap-2 mt-4">
              <button class="btn btn-ghost btn-sm" (click)="closeAddChild()">Cancelar</button>
              <button class="btn btn-primary btn-sm" [disabled]="addLoading()" (click)="submitAddChild()">
                @if (addLoading()) {
                  <span class="loading loading-spinner loading-sm"></span>
                } @else {
                  Vincular
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export default class ParentPortal {
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private ctx = inject(ParentContext);
  private router = inject(Router);

  public loading = signal(true);
  public children = signal<LinkedChild[]>([]);
  public showAddChild = signal(false);
  public addCode = '';
  public addLoading = signal(false);
  public addError = signal('');

  constructor() {
    afterRenderEffect(() => {
      this.loadChildren();
    });
  }

  loadChildren() {
    this.loading.set(true);
    this.http.get<ParentMeResponse[]>('/api/v1/parents/me').subscribe({
      next: (parents) => {
        const list: LinkedChild[] = [];
        for (const p of parents ?? []) {
          for (const s of p.students ?? []) {
            list.push({
              studentId: s.id,
              name: `${s.firstName} ${s.fatherName}`,
              schoolId: s.school?.id ?? '',
              schoolName: s.school?.name ?? 'Escuela',
              organizationId: p.organizationId,
              classGroupName: s.classGroup?.name ?? null,
            });
          }
        }
        this.children.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toasts.showError('No se pudieron cargar tus hijos');
      },
    });
  }

  openAddChild() {
    this.addCode = '';
    this.addError.set('');
    this.showAddChild.set(true);
  }

  closeAddChild() {
    this.showAddChild.set(false);
  }

  submitAddChild() {
    const code = this.addCode.trim().toUpperCase();
    if (!code) {
      this.addError.set('El código es requerido');
      return;
    }
    this.addLoading.set(true);
    this.addError.set('');
    this.http
      .post<{ status?: string; message?: string }>('/api/v1/auth/link-child', { enrollmentCode: code })
      .subscribe({
        next: (res) => {
          this.addLoading.set(false);
          this.showAddChild.set(false);
          this.toasts.showSuccess(res?.message || 'Hijo vinculado');
          this.loadChildren();
        },
        error: (err) => {
          this.addLoading.set(false);
          this.addError.set(err?.error?.message || err.message || 'Código inválido');
        },
      });
  }

  openChild(child: LinkedChild) {
    this.ctx.select(child);
    // Navigate to the child's progress view (per-child org context)
    this.router.navigate(['/parent/progress']);
  }
}
