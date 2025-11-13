import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionMatchDialogComponent } from './discussion-match-dialog.component';

describe('DiscussionMatchDialogComponent', () => {
  let component: DiscussionMatchDialogComponent;
  let fixture: ComponentFixture<DiscussionMatchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscussionMatchDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscussionMatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
