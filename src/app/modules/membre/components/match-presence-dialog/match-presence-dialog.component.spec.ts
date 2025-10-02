import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPresenceDialogComponent } from './match-presence-dialog.component';

describe('MatchPresenceDialogComponent', () => {
  let component: MatchPresenceDialogComponent;
  let fixture: ComponentFixture<MatchPresenceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPresenceDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchPresenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
