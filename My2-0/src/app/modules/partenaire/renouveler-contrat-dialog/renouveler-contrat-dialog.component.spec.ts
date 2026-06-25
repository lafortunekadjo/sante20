import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenouvelerContratDialogComponent } from './renouveler-contrat-dialog.component';

describe('RenouvelerContratDialogComponent', () => {
  let component: RenouvelerContratDialogComponent;
  let fixture: ComponentFixture<RenouvelerContratDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenouvelerContratDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenouvelerContratDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
