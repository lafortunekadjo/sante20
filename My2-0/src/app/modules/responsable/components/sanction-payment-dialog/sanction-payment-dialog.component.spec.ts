import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SanctionPaymentDialogComponent } from './sanction-payment-dialog.component';

describe('SanctionPaymentDialogComponent', () => {
  let component: SanctionPaymentDialogComponent;
  let fixture: ComponentFixture<SanctionPaymentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SanctionPaymentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SanctionPaymentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
