import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditDiffDialogComponent } from './audit-diff-dialog.component';

describe('AuditDiffDialogComponent', () => {
  let component: AuditDiffDialogComponent;
  let fixture: ComponentFixture<AuditDiffDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditDiffDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditDiffDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
