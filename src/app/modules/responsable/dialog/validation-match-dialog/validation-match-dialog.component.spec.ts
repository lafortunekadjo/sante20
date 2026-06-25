import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationMatchDialogComponent } from './validation-match-dialog.component';

describe('ValidationMatchDialogComponent', () => {
  let component: ValidationMatchDialogComponent;
  let fixture: ComponentFixture<ValidationMatchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationMatchDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidationMatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
