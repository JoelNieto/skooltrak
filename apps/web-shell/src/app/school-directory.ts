import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { PublicSchoolsForStoreDocument } from './graphql/generated/graphql';

@Component({
  selector: 'app-school-directory',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-padding max-w-3xl mx-auto py-10">
      <h1 class="text-2xl font-semibold mb-2">Tiendas escolares</h1>
      <p class="text-base-content/70 mb-6">Elige una escuela para ver sus productos.</p>
      @if (schools.isLoading()) {
        <p>Cargando…</p>
      } @else {
        <ul class="menu bg-base-100 rounded-box border border-base-200">
          @for (s of schools.value(); track s.id) {
            <li>
              <a [routerLink]="['/store', s.slug]" class="justify-between gap-3">
                <span class="flex min-w-0 items-center gap-3">
                  @if (s.logoUrl) {
                    <img
                      [src]="s.logoUrl"
                      [alt]=""
                      class="h-9 w-9 shrink-0 rounded-md border border-base-300 bg-base-200 object-contain"
                    />
                  } @else {
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    >
                      <span class="material-symbols-outlined text-xl">apartment</span>
                    </span>
                  }
                  <span class="truncate font-medium">{{ s.name }}</span>
                </span>
                <span class="badge badge-ghost shrink-0">{{ s.currencyCode }}</span>
              </a>
            </li>
          } @empty {
            <li class="px-4 py-3 text-base-content/60">No hay escuelas publicadas aún.</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class SchoolDirectory {
  private readonly apollo = inject(Apollo);

  protected schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery({
          query: PublicSchoolsForStoreDocument,
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.publicSchoolsForStore ?? [])),
  });
}
