import { Loader } from '@/ui';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';

type SchoolType = Prisma.SchoolGetPayload<false> & {
  logoUrl?: string | null;
};

@Component({
  selector: 'app-school',
  imports: [RouterLink, Loader, DatePipe, TabList, Tab, Tabs, TabPanel, TabContent],
  template: `
    @if (schoolResource.isLoading()) {
      <lib-loader />
    } @else {
      @if (schoolResource.hasValue()) {
        @let school = schoolResource.value();
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/admin">Admin</a></li>
            <li><a routerLink="/admin/schools">Colegios</a></li>
            <li>{{ school.name }}</li>
          </ul>
        </div>

        <!-- Header Card -->
        <div class="card w-full bg-base-100 mt-4">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div class="flex gap-4 items-center">
                <div
                  class="min-w-16 max-w-24 min-h-12 max-h-20 rounded-lg border border-base-300 flex items-center justify-center overflow-hidden bg-base-200"
                >
                  @if (school.logoUrl) {
                    <img [src]="school.logoUrl" [alt]="school.name" class="w-full h-auto object-contain" />
                  } @else {
                    <span class="material-symbols-outlined text-3xl text-base-content/30">school</span>
                  }
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-lg">{{ school.name }}</span>
                    <span class="badge badge-primary badge-sm">{{ school.shortName }}</span>
                  </div>
                  @if (school.city || school.country) {
                    <span class="text-sm text-base-content/60">
                      {{ getLocationString(school) }}
                    </span>
                  }
                </div>
              </div>
              <a [routerLink]="['/schools', school.id, 'edit']" class="btn btn-primary btn-sm">
                <span class="material-symbols-outlined text-lg">edit</span>
                Editar
              </a>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div ngTabs>
          <div class="flex justify-between items-center mt-4">
            <div ngTabList selectionMode="follow" selectedTab="info" class="tabs tabs-box">
              <div ngTab value="info" class="tab">Información General</div>
              <div ngTab value="contact" class="tab">Contacto</div>
              <div ngTab value="location" class="tab">Ubicación</div>
            </div>
          </div>
          <div class="p-1">
            <!-- Info Tab -->
            <div ngTabPanel value="info">
              <ng-template ngTabContent>
                <div class="bg-base-100 border-base-300 p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información General</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Datos principales del colegio</p>
                  </div>
                  <div class="mt-6 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Nombre completo</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.name }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Abreviatura</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.shortName }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Año actual</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.currentYear || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Fecha de creación</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.createdAt | date: 'dd/MM/yyyy' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Última actualización</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.updatedAt | date: 'dd/MM/yyyy HH:mm' }}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Contact Tab -->
            <div ngTabPanel value="contact">
              <ng-template ngTabContent>
                <div class="bg-base-100 border-base-300 p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Información de Contacto</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">
                      Datos de contacto y comunicación del colegio
                    </p>
                  </div>
                  <div class="mt-6 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Correo electrónico</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          @if (school.email) {
                            <a [href]="'mailto:' + school.email" class="link link-primary">{{ school.email }}</a>
                          } @else {
                            <span class="text-base-content/50">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Teléfono</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          @if (school.phone) {
                            <a [href]="'tel:' + school.phone" class="link link-primary">{{ school.phone }}</a>
                          } @else {
                            <span class="text-base-content/50">-</span>
                          }
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Sitio web</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          @if (school.website) {
                            <a
                              [href]="school.website"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="link link-primary"
                            >
                              {{ school.website }}
                              <span class="material-symbols-outlined text-sm align-middle">open_in_new</span>
                            </a>
                          } @else {
                            <span class="text-base-content/50">-</span>
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Location Tab -->
            <div ngTabPanel value="location">
              <ng-template ngTabContent>
                <div class="bg-base-100 border-base-300 p-4 rounded-lg">
                  <div class="px-4 sm:px-0">
                    <h3 class="text-base/7 font-semibold">Ubicación</h3>
                    <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Dirección física del colegio</p>
                  </div>
                  <div class="mt-6 border-t border-base-300">
                    <dl class="divide-y divide-base-300">
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Dirección</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.address || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Ciudad</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.city || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Estado/Provincia</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.state || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">Código postal</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.zip || '-' }}
                        </dd>
                      </div>
                      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt class="text-sm/6 font-medium text-base-content">País</dt>
                        <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                          {{ school.country || '-' }}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <!-- Map placeholder - could be enhanced with actual map integration -->
                  @if (school.address || school.city) {
                    <div class="mt-6 px-4 sm:px-0">
                      <a
                        [href]="getGoogleMapsUrl(school)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline btn-sm"
                      >
                        <span class="material-symbols-outlined text-lg">map</span>
                        Ver en Google Maps
                      </a>
                    </div>
                  }
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export default class School {
  public id = input.required<string>();
  private apollo = inject(Apollo);

  public schoolResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery<{
          school: SchoolType;
        }>({
          query: gql`
            query School($id: String!) {
              school(id: $id) {
                id
                name
                shortName
                logo
                logoUrl
                email
                phone
                website
                address
                city
                state
                zip
                country
                currentYear
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            id: params.id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.school)),
  });

  getLocationString(school: SchoolType): string {
    return [school.city, school.state, school.country].filter((x) => !!x).join(', ');
  }

  getGoogleMapsUrl(school: SchoolType): string {
    const parts = [school.address, school.city, school.state, school.zip, school.country].filter((x) => !!x);
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
}
