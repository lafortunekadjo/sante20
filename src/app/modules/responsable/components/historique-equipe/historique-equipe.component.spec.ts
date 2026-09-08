import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueEquipeComponent } from './historique-equipe.component';

describe('HistoriqueEquipeComponent', () => {
  let component: HistoriqueEquipeComponent;
  let fixture: ComponentFixture<HistoriqueEquipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueEquipeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueEquipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
