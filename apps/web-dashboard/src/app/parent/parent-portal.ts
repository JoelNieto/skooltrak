import { Button, Card, CardBody, Icon, PageHeader, Spinner, Toast, UiInput } from '#/ui';
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
  imports: [Spinner, Card, CardBody, UiInput, Button, FormsModule, PageHeader, Icon],
  template: `
    <lib-page-header title="Portal de padres" subtitle="Resumen rápido del progreso de tus hijos." />

    <div uiCard class="mt-6">
      <div uiCardBody>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-ink-strong">Hijos vinculados</h2>
          <button uiButton variant="primary" size="sm" (click)="openAddChild()">
            <ui-icon name="plus" class="text-lg" />
            Agregar hijo
          </button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <span uiSpinner></span>
          </div>
        } @else if (children().length === 0) {
          <div class="py-8 text-center text-ink-muted">
            Aún no tienes hijos vinculados. Usa "Agregar hijo" con el código de matrícula.
          </div>
        } @else {
          <div class="grid gap-4 md:grid-cols-2 mt-2">
            @for (child of children(); track child.studentId) {
              <button
                class="text-left border border-line rounded-lg p-4 hover:border-primary transition-colors"
                (click)="openChild(child)"
              >
                <p class="font-semibold text-ink-strong">{{ child.name }}</p>
                <p class="text-sm text-ink-muted">{{ child.schoolName }}</p>
                @if (child.classGroupName) {
                  <p class="text-sm text-ink-muted">Grupo: {{ child.classGroupName }}</p>
                }
              </button>
            }
          </div>
        }
      </div>
    </div>

    @if (showAddChild()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div uiCard class="w-full max-w-md">
          <div uiCardBody>
            <h3 class="text-lg font-semibold text-ink-strong">Agregar hijo</h3>
            <p class="text-sm text-ink-muted">Ingresa el código de matrícula del estudiante.</p>

            <input uiInput class="mt-2 uppercase" placeholder="Código de matrícula" [(ngModel)]="addCode" />

            @if (addError()) {
              <p class="text-error text-sm mt-2">{{ addError() }}</p>
            }

            <div class="flex justify-end gap-2 mt-4">
              <button uiButton variant="ghost" size="sm" (click)="closeAddChild()">Cancelar</button>
              <button
                uiButton
                [loading]="addLoading()"
                variant="primary"
                size="sm"
                [disabled]="addLoading()"
                (click)="submitAddChild()"
              >
                @if (!addLoading()) {
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
