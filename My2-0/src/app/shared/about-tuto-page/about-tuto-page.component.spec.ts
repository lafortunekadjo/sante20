import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutTutoPageComponent } from './about-tuto-page.component';

describe('AboutTutoPageComponent', () => {
  let component: AboutTutoPageComponent;
  let fixture: ComponentFixture<AboutTutoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutTutoPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutTutoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
