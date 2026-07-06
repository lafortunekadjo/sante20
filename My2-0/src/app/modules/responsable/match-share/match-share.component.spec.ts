import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchShareComponent } from './match-share.component';

describe('MatchShareComponent', () => {
  let component: MatchShareComponent;
  let fixture: ComponentFixture<MatchShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchShareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
