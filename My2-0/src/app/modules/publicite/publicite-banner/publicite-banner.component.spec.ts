import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteBannerComponent } from './publicite-banner.component';

describe('PubliciteBannerComponent', () => {
  let component: PubliciteBannerComponent;
  let fixture: ComponentFixture<PubliciteBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
