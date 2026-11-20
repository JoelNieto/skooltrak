import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Auth from '../auth/auth';
import Courses from './courses';

describe('Courses', () => {
  let component: Courses;
  let fixture: ComponentFixture<Courses>;

  beforeEach(async () => {
    const user = signal(null);
    await TestBed.configureTestingModule({
      imports: [Courses],
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

    fixture = TestBed.createComponent(Courses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
