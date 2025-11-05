import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchRequestDialogComponent } from './match-request-dialog.component';

describe('MatchRequestDialogComponent', () => {
  let component: MatchRequestDialogComponent;
  let fixture: ComponentFixture<MatchRequestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRequestDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
