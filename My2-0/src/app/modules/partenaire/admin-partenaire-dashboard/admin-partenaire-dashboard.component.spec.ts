import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPartenaireDashboardComponent } from './admin-partenaire-dashboard.component';

describe('AdminPartenaireDashboardComponent', () => {
  let component: AdminPartenaireDashboardComponent;
  let fixture: ComponentFixture<AdminPartenaireDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPartenaireDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPartenaireDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
