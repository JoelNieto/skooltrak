import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  Icon,
  Loader,
  UiTab,
  UiTabContent,
  UiTabList,
  UiTabPanel,
  UiTabs,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isValidId } from '../../core/validators';
import { SchoolPeriods } from '../components/school-periods';

type SchoolDetail = {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string | null;
  currentYear?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  zip?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

@Component({
  selector: 'app-school',
  imports: [
    Breadcrumbs,
    Badge,
    Card,
    CardBody,
    Button,
    RouterLink,
    Loader,
    DatePipe,
    UiTabList,
    UiTab,
    UiTabs,
    UiTabPanel,
    UiTabContent,
    Icon,
    SchoolPeriods,
  ],
  template: `
    @if (schoolResource.isLoading()) {
      <lib-loader />
    } @else {
      @if (schoolResource.hasValue() && schoolResource.value()?.id) {
        @let school = schoolResource.value()!;
        <ui-breadcrumbs
          [items]="[
            { label: 'Inicio', link: '/' },
            { label: 'Admin', link: '/admin' },
            { label: 'Colegios', link: '/admin/schools' },
            { label: school.name },
          ]"
        />

        <!-- Header Card -->
        <div uiCard class="w-full mt-4">
          <div uiCardBody>
            <div class="flex items-center justify-between">
              <div class="flex gap-4 items-center">
                <div
                  class="min-w-16 max-w-24 min-h-12 max-h-20 rounded-lg border border-line flex items-center justify-center overflow-hidden bg-surface-0"
                >
                  @if (school.logoUrl) {
                    <img [src]="school.logoUrl" [alt]="school.name" class="w-full h-auto object-contain" />
                  } @else {
                    <ui-icon name="school" class="text-3xl text-ink-subtle" />
                  }
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-lg">{{ school.name }}</span>
                    <span uiBadge tone="action" size="sm">{{ school.shortName }}</span>
                  </div>
                  @if (school.city || school.country) {
                    <span class="text-sm text-ink-muted">
                      {{ getLocationString(school) }}
                    </span>
                  }
                </div>
              </div>
              <a uiButton variant="primary" size="sm" [routerLink]="['/schools', school.id, 'edit']">
                <ui-icon name="pencil" class="text-lg" />
                Editar
              </a>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div uiTabs>
          <div class="flex justify-between items-center mt-4 px-1">
            <div uiTabList selectedTab="info" aria-label="Secciones del colegio">
              <button uiTab value="info">Información General</button>
              <button uiTab value="contact">Contacto</button>
              <button uiTab value="location">Ubicación</button>
              <button uiTab value="periods">Periodos</button>
            </div>
          </div>
          <div class="p-1">
            <!-- Info Tab -->
            <div uiTabPanel value="info">
              <ng-template uiTabContent>
                <div class="bg-surface-1 border-line p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información General</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Datos principales del colegio</p>
                  </div>
                  <div class="mt-6 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Nombre completo</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.name }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Abreviatura</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.shortName }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Año actual</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.currentYear || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Fecha de creación</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.createdAt | date: 'dd/MM/yyyy' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Última actualización</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.updatedAt | date: 'dd/MM/yyyy HH:mm' }}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Contact Tab -->
            <div uiTabPanel value="contact">
              <ng-template uiTabContent>
                <div class="bg-surface-1 border-line p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información de Contacto</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Datos de contacto y comunicación del colegio</p>
                  </div>
                  <div class="mt-6 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Correo electrónico</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          @if (school.email) {
                            <a [href]="'mailto:' + school.email" class="link link-primary">{{ school.email }}</a>
                          } @else {
                            <span class="text-ink-subtle">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          @if (school.phone) {
                            <a [href]="'tel:' + school.phone" class="link link-primary">{{ school.phone }}</a>
                          } @else {
                            <span class="text-ink-subtle">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Sitio web</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          @if (school.website) {
                            <a
                              [href]="school.website"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="link link-primary"
                            >
                              {{ school.website }}
                              <ui-icon name="external-link" class="text-sm align-middle" />
                            </a>
                          } @else {
                            <span class="text-ink-subtle">-</span>
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Location Tab -->
            <div uiTabPanel value="location">
              <ng-template uiTabContent>
                <div class="bg-surface-1 border-line p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Ubicación</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-ink-muted">Dirección física del colegio</p>
                  </div>
                  <div class="mt-6 border-t border-line">
                    <dl class="divide-y divide-line">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Dirección</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.address || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Ciudad</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.city || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Estado/Provincia</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.state || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">Código postal</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.zip || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-ink-strong">País</dt>
                        <dd class="mt-1 text-sm/6 text-ink sm:col-span-2 sm:mt-0">
                          {{ school.country || '-' }}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <!-- Map placeholder - could be enhanced with actual map integration -->
                  @if (school.address || school.city) {
                    <div class="mt-6 px-4 sm:px-0">
                      <a uiButton size="sm" [href]="getGoogleMapsUrl(school)" target="_blank" rel="noopener noreferrer">
                        <ui-icon name="map" class="text-lg" />
                        Ver en Google Maps
                      </a>
                    </div>
                  }
                </div>
              </ng-template>
            </div>

            <!-- Periods Tab -->
            <div uiTabPanel value="periods">
              <ng-template uiTabContent>
                <app-school-periods [schoolId]="school.id" [currentYear]="school.currentYear" />
              </ng-template>
            </div>
          </div>
        </div>
      } @else {
        <div>No se encontró el colegio</div>
      }
    }
  `,
})
export default class School {
  public id = input.required<string>();
  public schoolResource = httpResource<SchoolDetail | null>(() =>
    isValidId(this.id()) ? `/api/v1/schools/${this.id()}` : undefined,
  );

  getLocationString(school: SchoolDetail): string {
    return [school.city, school.state, school.country].filter((x) => !!x).join(', ');
  }

  getGoogleMapsUrl(school: SchoolDetail): string {
    const parts = [school.address, school.city, school.state, school.zip, school.country].filter((x) => !!x);
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
}
