import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Mi perfil</li>
      </ul>
    </div>
  `,
})
export default class Profile {
  constructor() {
    console.log('Profile');
  }
}
