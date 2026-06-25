import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayersListDialogComponent } from './players-list-dialog.component';

describe('PlayersListDialogComponent', () => {
  let component: PlayersListDialogComponent;
  let fixture: ComponentFixture<PlayersListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayersListDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayersListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
