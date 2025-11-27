import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-compose',
  imports: [RouterLink],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/messages">Mensajes</a></li>
        <li>Nuevo mensaje</li>
      </ul>
    </div>
    <form></form>`,
})
export default class Compose {}
