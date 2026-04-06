import { SchoolContext } from '@/shared';
import { Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import {
  CreateStoreCategoryDocument,
  DeleteStoreCategoryDocument,
  StoreCategoriesAdminDocument,
  UpdateStoreCategoryDocument,
} from '../graphql/generated/graphql';

@Component({
  selector: 'app-categories-admin',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-lg font-medium mb-4">Categorías</h3>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <form class="flex flex-wrap gap-2 mb-6" (ngSubmit)="create(); $event.preventDefault()">
        <input class="input input-bordered input-sm" placeholder="Nueva categoría" [(ngModel)]="newName" name="n" />
        <button type="submit" class="btn btn-primary btn-sm">Agregar</button>
      </form>
      <div class="overflow-x-auto rounded-box border border-base-200">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Orden</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of categories.value(); track c.id) {
              <tr>
                <td>
                  <input class="input input-bordered input-sm" [(ngModel)]="editNames[c.id!]" [name]="'n' + c.id" />
                </td>
                <td>
                  <input
                    class="input input-bordered input-sm w-20"
                    type="number"
                    [(ngModel)]="editOrder[c.id!]"
                    [name]="'o' + c.id"
                  />
                </td>
                <td>
                  <input type="checkbox" class="toggle toggle-sm" [(ngModel)]="editActive[c.id!]" [name]="'a' + c.id" />
                </td>
                <td class="flex gap-2">
                  <button type="button" class="btn btn-primary btn-soft btn-sm" (click)="save(c.id!)">Guardar</button>
                  <button type="button" class="btn btn-error btn-soft btn-sm" (click)="remove(c.id!)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              @if (categories.isLoading()) {
                <tr>
                  <td colspan="4">Cargando…</td>
                </tr>
              } @else {
                <tr>
                  <td colspan="4">Sin categorías.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export default class CategoriesAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly apollo = inject(Apollo);
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
      return this.apollo
        .watchQuery({
          query: StoreCategoriesAdminDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((r) => {
            const list = r.data?.storeCategoriesAdmin ?? [];
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

  protected create() {
    console.log('create', this.newName);
    const schoolId = this.school.currentSchoolId();
    console.log('schoolId', schoolId);
    if (!schoolId || !this.newName.trim()) return;
    this.apollo
      .mutate({
        mutation: CreateStoreCategoryDocument,
        variables: { input: { schoolId, name: this.newName.trim() } },
      })
      .subscribe({
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
    this.apollo
      .mutate({
        mutation: UpdateStoreCategoryDocument,
        variables: {
          input: {
            id,
            name: this.editNames[id],
            sortOrder: this.editOrder[id],
            active: this.editActive[id],
          },
        },
      })
      .subscribe({
        next: () => this.toast.showSuccess('Guardado'),
        error: (e: Error) => this.toast.showError(e.message),
      });
  }

  protected remove(id: string) {
    this.apollo.mutate({ mutation: DeleteStoreCategoryDocument, variables: { id } }).subscribe({
      next: () => {
        this.toast.showSuccess('Eliminada');
        this.tick.update((n) => n + 1);
      },
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
