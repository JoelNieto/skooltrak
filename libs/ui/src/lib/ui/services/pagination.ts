import { Injectable, signal } from '@angular/core';

@Injectable()
export class Pagination {
  public model = signal({
    take: 10,
    skip: 0,
    count: 0,
    search: '',
  });
}
