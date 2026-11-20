import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Auth from '../auth/auth';
import Assignments from './assignments';

describe('Assignments', () => {
  let component: Assignments;
  let fixture: ComponentFixture<Assignments>;

  beforeEach(async () => {
    const user = signal(null);
    await TestBed.configureTestingModule({
      imports: [Assignments],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Auth,
          useValue: {
            user,
            userName: computed(() => ''),
            userInitials: computed(() => ''),
            userColor: computed(() => undefined),
            themePreference: computed(() => undefined),
            isAdmin: computed(() => false),
            isTeacher: computed(() => false),
            isStudent: computed(() => false),
            isParent: computed(() => false),
            hasPermission: () => false,
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Assignments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
