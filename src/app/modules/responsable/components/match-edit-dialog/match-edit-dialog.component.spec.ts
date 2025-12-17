import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchEditDialogComponent } from './match-edit-dialog.component';

describe('MatchEditDialogComponent', () => {
  let component: MatchEditDialogComponent;
  let fixture: ComponentFixture<MatchEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
