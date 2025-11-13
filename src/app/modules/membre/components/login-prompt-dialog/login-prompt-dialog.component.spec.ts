import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPromptDialogComponent } from './login-prompt-dialog.component';

describe('LoginPromptDialogComponent', () => {
  let component: LoginPromptDialogComponent;
  let fixture: ComponentFixture<LoginPromptDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPromptDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPromptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
