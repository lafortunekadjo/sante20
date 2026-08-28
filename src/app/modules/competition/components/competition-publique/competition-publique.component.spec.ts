import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionPubliqueComponent } from './competition-publique.component';

describe('CompetitionPubliqueComponent', () => {
  let component: CompetitionPubliqueComponent;
  let fixture: ComponentFixture<CompetitionPubliqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitionPubliqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitionPubliqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
