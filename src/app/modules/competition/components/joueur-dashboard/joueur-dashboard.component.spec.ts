import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoueurDashboardComponent } from './joueur-dashboard.component';

describe('JoueurDashboardComponent', () => {
  let component: JoueurDashboardComponent;
  let fixture: ComponentFixture<JoueurDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoueurDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoueurDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
