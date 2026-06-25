import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandesBadgeComponent } from './demandes-badge.component';

describe('DemandesBadgeComponent', () => {
  let component: DemandesBadgeComponent;
  let fixture: ComponentFixture<DemandesBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandesBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandesBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
