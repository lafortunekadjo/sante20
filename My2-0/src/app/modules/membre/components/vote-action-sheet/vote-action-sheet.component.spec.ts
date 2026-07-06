import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteActionSheetComponent } from './vote-action-sheet.component';

describe('VoteActionSheetComponent', () => {
  let component: VoteActionSheetComponent;
  let fixture: ComponentFixture<VoteActionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteActionSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoteActionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
