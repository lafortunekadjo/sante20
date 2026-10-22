import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionRecompensesSanctionsComponent } from './competition-recompenses-sanctions.component';

describe('CompetitionRecompensesSanctionsComponent', () => {
  let component: CompetitionRecompensesSanctionsComponent;
  let fixture: ComponentFixture<CompetitionRecompensesSanctionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitionRecompensesSanctionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitionRecompensesSanctionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
