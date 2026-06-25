import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordResetResultDialogComponent } from './password-reset-result-dialog.component';

describe('PasswordResetResultDialogComponent', () => {
  let component: PasswordResetResultDialogComponent;
  let fixture: ComponentFixture<PasswordResetResultDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordResetResultDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordResetResultDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
