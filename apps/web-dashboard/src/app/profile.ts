import { Component } from '@angular/core';
@Component({
  selector: 'app-profile',
  template: `
    <div>
      <h1>Profile</h1>
    </div>
  `,
})
export default class Profile {
  constructor() {
    console.log('Profile');
  }
}
