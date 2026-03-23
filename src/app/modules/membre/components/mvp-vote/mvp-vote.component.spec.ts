import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MvpVoteComponent } from './mvp-vote.component';

describe('MvpVoteComponent', () => {
  let component: MvpVoteComponent;
  let fixture: ComponentFixture<MvpVoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MvpVoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MvpVoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
