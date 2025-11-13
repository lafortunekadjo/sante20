import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RDashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: RDashboardComponent;
  let fixture: ComponentFixture<RDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
