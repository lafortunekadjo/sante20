import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampagneBannerComponent } from './campagne-banner.component';

describe('CampagneBannerComponent', () => {
  let component: CampagneBannerComponent;
  let fixture: ComponentFixture<CampagneBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampagneBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampagneBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
