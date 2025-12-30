import { Component } from '@angular/core';
@Component({
  selector: 'app-student-home',
  template: `
    <div>
      <h1>Student Home</h1>
    </div>
  `,
})
export default class StudentHome {
  constructor() {
    console.log('StudentHome');
  }
}
