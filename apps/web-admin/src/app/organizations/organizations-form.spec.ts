import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsForm } from './organizations-form';

describe('OrganizationsForm', () => {
  let component: OrganizationsForm;
  let fixture: ComponentFixture<OrganizationsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsForm],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
