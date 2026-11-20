import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paginator } from './paginator';

describe('Paginator', () => {
  let component: Paginator;
  let fixture: ComponentFixture<Paginator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paginator],
    }).compileComponents();

    fixture = TestBed.createComponent(Paginator);
    component = fixture.componentInstance;
    // `take` and `skip` are required models: set them before the first render.
    fixture.componentRef.setInput('take', 10);
    fixture.componentRef.setInput('skip', 0);
    fixture.componentRef.setInput('count', 25);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the current range and one button per page', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Mostrando de 1 a 10 de 25');
    expect(component.pageItems()).toEqual([1, 2, 3]);
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
  });

  it('moves to the next page and disables previous on the first page', () => {
    const el = fixture.nativeElement as HTMLElement;
    const prev = el.querySelector<HTMLButtonElement>('[aria-label="Página anterior"]');
    expect(prev?.disabled).toBe(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')?.click();
    fixture.detectChanges();

    expect(component.skip()).toBe(10);
    expect(component.currentPage()).toBe(2);
    expect(prev?.disabled).toBe(false);
  });
});
