import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Auth from '../auth/auth';
import Store from './store';

describe('Store', () => {
  let service: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: { user: signal(null) } }],
    });
    service = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
