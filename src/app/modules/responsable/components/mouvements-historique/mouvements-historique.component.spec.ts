import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MouvementsHistoriqueComponent } from './mouvements-historique.component';

describe('MouvementsHistoriqueComponent', () => {
  let component: MouvementsHistoriqueComponent;
  let fixture: ComponentFixture<MouvementsHistoriqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MouvementsHistoriqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MouvementsHistoriqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
