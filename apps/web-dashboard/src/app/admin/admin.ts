import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Admin</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold">Admin</h1>
    <div class="border-b border-base-300">
      <ul class="menu menu-horizontal gap-2 ">
        <li>
          <a routerLink="schools" routerLinkActive="bg-primary text-primary-content">Colegios</a>
        </li>
        <li>
          <a routerLink="subjects" routerLinkActive="bg-primary text-primary-content"> Asignaturas</a>
        </li>
        <li>
          <a routerLink="courses" routerLinkActive="bg-primary text-primary-content">Cursos</a>
        </li>
        <li>
          <a routerLink="degrees" routerLinkActive="bg-primary text-primary-content">Niveles</a>
        </li>
        <li>
          <a routerLink="study-plans" routerLinkActive="bg-primary text-primary-content">Planes</a>
        </li>
        <li>
          <a routerLink="class-groups" routerLinkActive="bg-primary text-primary-content">Grupos</a>
        </li>
        <li>
          <a routerLink="parents" routerLinkActive="bg-primary text-primary-content">Padres</a>
        </li>
        <li>
          <a routerLink="attendance-reporting" routerLinkActive="bg-primary text-primary-content">Asistencia</a>
        </li>
        <li>
          <a routerLink="financial-module" routerLinkActive="bg-primary text-primary-content">Finanzas</a>
        </li>
        <li>
          <a routerLink="events-calendar" routerLinkActive="bg-primary text-primary-content">Eventos</a>
        </li>
        <li>
          <a routerLink="join-requests" routerLinkActive="bg-primary text-primary-content">Solicitudes</a>
        </li>
        <li>
          <a routerLink="newsletters" routerLinkActive="bg-primary text-primary-content">Boletines</a>
        </li>
      </ul>
    </div>
    <div class="pt-4">
      <router-outlet />
    </div>
  `,
})
export default class Admin {}
