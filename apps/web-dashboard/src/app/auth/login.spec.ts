import { Toast } from '#/ui';
import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Auth from './auth';
import Login from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const signIn = vi.fn().mockResolvedValue(undefined);
  const showError = vi.fn();

  beforeEach(async () => {
    signIn.mockClear();
    showError.mockClear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { signIn } },
        { provide: Toast, useValue: { showError } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    const [defer] = await fixture.getDeferBlocks();
    await defer.render(DeferBlockState.Complete);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links to register, forgot password and passwordless access', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(expect.arrayContaining(['/register', '/forgot-password', '/auth/magic-link']));
  });

  it('toggles password visibility', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[autocomplete="current-password"]');
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.eye');
    expect(input.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar contraseña');
  });

  it('does not sign in with an invalid form', async () => {
    await component.onSubmit(new Event('submit'));
    expect(signIn).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('Llenar todos los campos');
  });
});
