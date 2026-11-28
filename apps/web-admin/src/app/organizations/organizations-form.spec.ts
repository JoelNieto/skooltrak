import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsForm } from './organizations-form';

describe('OrganizationsForm', () => {
  let component: OrganizationsForm;
  let fixture: ComponentFixture<OrganizationsForm>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationsForm);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates the organization with its admin invitation @FR-IAM-001.1', async () => {
    component.formModel.set({
      name: 'Instituto Bilingüe del Pacífico',
      description: '',
      adminFirstName: 'Ana',
      adminLastName: 'Castillo',
      adminEmail: 'acastillo@ibp.test',
    });
    const submit = component.onSubmit(new Event('submit'));
    const req = http.expectOne('/api/v1/organizations/with-invitation');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Instituto Bilingüe del Pacífico',
      description: '',
      admin: { firstName: 'Ana', lastName: 'Castillo', email: 'acastillo@ibp.test' },
    });
    req.flush({ organizationId: 'org-1' });
    await submit;
    http.verify();
  });

  it('does not submit without the admin email', async () => {
    component.formModel.set({ name: 'X', description: '', adminFirstName: 'Ana', adminLastName: 'C', adminEmail: '' });
    await component.onSubmit(new Event('submit'));
    http.expectNone('/api/v1/organizations/with-invitation');
  });
});
