import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteSplashComponent } from './publicite-splash.component';

describe('PubliciteSplashComponent', () => {
  let component: PubliciteSplashComponent;
  let fixture: ComponentFixture<PubliciteSplashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteSplashComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteSplashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
