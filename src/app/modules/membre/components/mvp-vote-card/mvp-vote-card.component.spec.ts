import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MvpVoteCardComponent } from './mvp-vote-card.component';

describe('MvpVoteCardComponent', () => {
  let component: MvpVoteCardComponent;
  let fixture: ComponentFixture<MvpVoteCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MvpVoteCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MvpVoteCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
