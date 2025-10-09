import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolsForm } from './schools-form';

describe('SchoolsForm', () => {
  let component: SchoolsForm;
  let fixture: ComponentFixture<SchoolsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolsForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
