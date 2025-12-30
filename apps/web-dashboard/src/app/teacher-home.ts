import { Component } from '@angular/core';
@Component({
  selector: 'app-teacher-home',
  template: `
    <div>
      <h1>Teacher Home</h1>
    </div>
  `,
})
export default class TeacherHome {
  constructor() {
    console.log('TeacherHome');
  }
}
