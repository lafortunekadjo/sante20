import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateInvitationDialogComponent } from './create-invitation-dialog.component';

describe('CreateInvitationDialogComponent', () => {
  let component: CreateInvitationDialogComponent;
  let fixture: ComponentFixture<CreateInvitationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateInvitationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateInvitationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
