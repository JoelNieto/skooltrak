import { SchoolContext } from '@/shared';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, filter, map, of, switchMap, distinctUntilChanged } from 'rxjs';
import { CartService } from '../cart.service';
import { StoreApiService } from '../store-api.service';
import StoreThemeToggle from '../store-theme-toggle';
import { StoreThemeService } from '../store-theme.service';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, StoreThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-padding pb-10">
      <div class="breadcrumbs text-sm mb-4">
        <ul>
          <li><a routerLink="/">Inicio</a></li>
          <li><a routerLink="/store">Tiendas</a></li>
          @if (schoolName()) {
            <li class="text-base-content/80">{{ schoolName() }}</li>
          }
        </ul>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          @if (schoolLogoUrl()) {
            <img
              [src]="schoolLogoUrl()!"
              [alt]="schoolName() ?? 'Escuela'"
              class="h-12 w-12 shrink-0 rounded-lg border border-base-300 bg-base-200 object-contain"
            />
          } @else {
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <span class="material-symbols-outlined text-2xl">apartment</span>
            </div>
          }
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-semibold text-base-content">
              {{ schoolName() ?? 'Tienda escolar' }}
            </h1>
            <p class="text-sm text-base-content/60">Tienda escolar</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <app-store-theme-toggle />
          @if (canManage()) {
            <a routerLink="admin" class="btn btn-outline btn-sm">Administrar tienda</a>
          }
          <a routerLink="cart" class="btn btn-primary btn-sm gap-1">
            <span class="material-symbols-outlined text-lg">shopping_cart</span>
            Carrito
            @if (cartCount() > 0) {
              <span class="badge badge-secondary">{{ cartCount() }}</span>
            }
          </a>
        </div>
      </div>
      <router-outlet />
    </div>
  `,
})
export default class StoreLayout {
  private readonly api = inject(StoreApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly schoolContext = inject(SchoolContext);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cartService = inject(CartService);
  private readonly storeTheme = inject(StoreThemeService);

  constructor() {
    effect(() => {
      const pref = this.me.value()?.themePreference;
      if (pref) {
        this.storeTheme.applyTheme(pref);
      }
    });
    const paramRoute = this.route.parent ?? this.route;
    paramRoute.paramMap
      .pipe(
        map((pm) => pm.get('schoolSlug')),
        filter((s): s is string => !!s),
        distinctUntilChanged(),
        switchMap((slug) => this.api.publicSchoolBySlug(slug)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((school) => {
        if (school?.id && school.slug && school.currencyCode) {
          this.schoolContext.currentSchoolId.set(school.id);
          this.schoolContext.currentSchoolSlug.set(school.slug);
          this.schoolContext.currencyCode.set(school.currencyCode);
          this.schoolContext.currentSchoolName.set(school.name ?? null);
          this.schoolContext.currentSchoolLogoUrl.set(school.logoUrl ?? null);
          this.schoolName.set(school.name ?? null);
          this.schoolLogoUrl.set(school.logoUrl ?? null);
        } else {
          this.schoolContext.currentSchoolName.set(null);
          this.schoolContext.currentSchoolLogoUrl.set(null);
          this.schoolName.set(null);
          this.schoolLogoUrl.set(null);
        }
      });
  }

  protected readonly schoolName = signal<string | null>(null);
  protected readonly schoolLogoUrl = signal<string | null>(null);

  protected readonly me = rxResource({
    stream: () => this.api.getMe().pipe(catchError(() => of(null))),
  });

  protected canManage = () => {
    const me = this.me.value();
    const roleName = me?.role?.name;
    const perms =
      me?.role?.permissions?.map((p: { descriptiveId: string }) => p.descriptiveId) ?? [];
    return (
      perms.includes('MANAGE_STORE') ||
      roleName === 'ADMIN' ||
      roleName === 'ORG_ADMIN'
    );
  };

  protected cartCount = () => this.cartService.itemCount();
}
