import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPosterComponent } from './match-poster.component';

describe('MatchPosterComponent', () => {
  let component: MatchPosterComponent;
  let fixture: ComponentFixture<MatchPosterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPosterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchPosterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
