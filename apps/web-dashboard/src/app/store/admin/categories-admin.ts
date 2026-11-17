import { SchoolContext } from '#/shared';
import {
  Alert,
  Button,
  Card,
  Toast,
  UiInput,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiToggle,
  listState,
} from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-categories-admin',
  imports: [Alert, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiInput, UiToggle, Button, FormsModule],
  template: `
    <h3 class="text-lg font-medium mb-4">Categorías</h3>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <form class="flex flex-wrap gap-2 mb-6" (ngSubmit)="create(); $event.preventDefault()">
        <input uiInput size="sm" placeholder="Nueva categoría" [(ngModel)]="newName" name="n" />
        <button uiButton variant="primary" size="sm" type="submit">Agregar</button>
      </form>
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="categories.isLoading()">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Orden</th>
              <th>Activo</th>
              <th><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (categoriesList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="4"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="4" (retry)="categories.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (c of categoriesList.rows() ?? []; track c.id) {
                  <tr>
                    <td>
                      <input uiInput size="sm" [(ngModel)]="editNames[c.id!]" [name]="'n' + c.id" />
                    </td>
                    <td>
                      <input
                        uiInput
                        size="sm"
                        class="w-20"
                        type="number"
                        [(ngModel)]="editOrder[c.id!]"
                        [name]="'o' + c.id"
                      />
                    </td>
                    <td>
                      <input
                        uiToggle
                        tone="neutral"
                        size="sm"
                        type="checkbox"
                        [(ngModel)]="editActive[c.id!]"
                        [name]="'a' + c.id"
                      />
                    </td>
                    <td class="flex gap-2">
                      <button uiButton size="sm" type="button" (click)="save(c.id!)">Guardar</button>
                      <button uiButton variant="danger" size="sm" type="button" (click)="remove(c.id!)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="4"
                    icon="tag"
                    title="Aún no hay categorías"
                    description="Agrega la primera con el campo de arriba."
                  ></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    }
  `,
})
export default class CategoriesAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly tick = signal(0);

  protected newName = '';
  protected editNames: Record<string, string> = {};
  protected editOrder: Record<string, number> = {};
  protected editActive: Record<string, boolean> = {};

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), t: this.tick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.api.storeCategoriesAdmin(params.schoolId).pipe(
        map((rows) => {
          const list = Array.isArray(rows) ? rows : [];
          for (const c of list) {
            const id = c.id!;
            if (this.editNames[id] === undefined) this.editNames[id] = c.name ?? '';
            if (this.editOrder[id] === undefined) this.editOrder[id] = c.sortOrder ?? 0;
            if (this.editActive[id] === undefined) this.editActive[id] = c.active ?? true;
          }
          return list;
        }),
      );
    },
  });

  /** categories with smooth loading: rows stay while the list reloads after a change. */
  protected readonly categoriesList = listState(this.categories);

  protected create() {
    console.log('create', this.newName);
    const schoolId = this.school.currentSchoolId();
    console.log('schoolId', schoolId);
    if (!schoolId || !this.newName.trim()) return;
    this.api.createStoreCategory({ schoolId, name: this.newName.trim() }).subscribe({
      next: () => {
        this.newName = '';
        this.toast.showSuccess('Categoría creada');
        this.tick.update((n) => n + 1);
        console.log('created');
      },
      error: (e: Error) => {
        this.toast.showError(e.message);
        console.error(e);
      },
    });
  }

  protected save(id: string) {
    this.api
      .updateStoreCategory({
        id,
        name: this.editNames[id],
        sortOrder: this.editOrder[id],
        active: this.editActive[id],
      })
      .subscribe({
        next: () => this.toast.showSuccess('Guardado'),
        error: (e: Error) => this.toast.showError(e.message),
      });
  }

  protected remove(id: string) {
    this.api.deleteStoreCategory(id).subscribe({
      next: () => {
        this.toast.showSuccess('Eliminada');
        this.tick.update((n) => n + 1);
      },
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
