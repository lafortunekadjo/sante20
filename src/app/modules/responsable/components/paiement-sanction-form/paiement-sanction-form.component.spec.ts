import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementSanctionFormComponent } from './paiement-sanction-form.component';

describe('PaiementSanctionFormComponent', () => {
  let component: PaiementSanctionFormComponent;
  let fixture: ComponentFixture<PaiementSanctionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementSanctionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaiementSanctionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
