import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDemandesGroupeComponent } from './gestion-demandes-groupe.component';

describe('GestionDemandesGroupeComponent', () => {
  let component: GestionDemandesGroupeComponent;
  let fixture: ComponentFixture<GestionDemandesGroupeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionDemandesGroupeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionDemandesGroupeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
