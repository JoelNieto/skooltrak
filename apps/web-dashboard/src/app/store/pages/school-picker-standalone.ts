import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import StoreThemeToggle from '../store-theme-toggle';
import { Badge, Icon } from '#/ui';

@Component({
  selector: 'app-school-picker-standalone',
  imports: [Badge, RouterLink, StoreThemeToggle, Icon],
  template: `
    <div class="layout-padding max-w-3xl mx-auto py-10">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold mb-2">Tiendas escolares</h1>
          <p class="text-ink-muted">Elige una escuela para ver sus productos.</p>
        </div>
        <app-store-theme-toggle class="shrink-0" />
      </div>
      @if (schools.isLoading()) {
        <p>Cargando…</p>
      } @else {
        <ul class="menu bg-surface-1 rounded-box border border-line mt-0">
          @for (s of schools.value(); track s.id) {
            <li>
              <a [routerLink]="['/store', s.slug]" class="justify-between gap-3">
                <span class="flex min-w-0 items-center gap-3">
                  @if (s.logoUrl) {
                    <img
                      [src]="s.logoUrl"
                      [alt]=""
                      class="h-9 w-9 shrink-0 rounded-md border border-line bg-surface-0 object-contain"
                    />
                  } @else {
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-action-subtle text-primary"
                    >
                      <ui-icon name="building-2" class="text-xl" />
                    </span>
                  }
                  <span class="truncate font-medium">{{ s.name }}</span>
                </span>
                <span uiBadge class="shrink-0">{{ s.currencyCode }}</span>
              </a>
            </li>
          } @empty {
            <li class="px-4 py-3 text-ink-muted">No hay escuelas publicadas aún.</li>
          }
        </ul>
      }
    </div>
  `,
})
export default class SchoolPickerStandalone {
  private readonly api = inject(StoreApiService);

  protected schools = rxResource({
    stream: () => this.api.publicSchoolsForStore().pipe(map((rows) => (Array.isArray(rows) ? rows : []))),
  });
}
