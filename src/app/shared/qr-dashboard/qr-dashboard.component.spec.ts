import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrDashboardComponent } from './qr-dashboard.component';

describe('QrDashboardComponent', () => {
  let component: QrDashboardComponent;
  let fixture: ComponentFixture<QrDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
