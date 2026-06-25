import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MvpWinnerComponent } from './mvp-winner.component';

describe('MvpWinnerComponent', () => {
  let component: MvpWinnerComponent;
  let fixture: ComponentFixture<MvpWinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MvpWinnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MvpWinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
