import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionsForm } from './permissions-form';

describe('PermissionsForm', () => {
  let component: PermissionsForm;
  let fixture: ComponentFixture<PermissionsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionsForm],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
