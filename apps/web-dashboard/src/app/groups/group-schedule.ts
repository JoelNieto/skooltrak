import { Loader } from '@/ui';
import { Component, inject, input } from '@angular/core';
import { Apollo } from 'apollo-angular';

@Component({
  imports: [Loader],
  template: `
    <div>
      <h1>Group Schedule</h1>
    </div>
  `,
})
export default class GroupSchedule {
  public id = input<string>();
  private apollo = inject(Apollo);
}
