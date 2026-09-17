import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XpWidgetComponent } from './xp-widget.component';

describe('XpWidgetComponent', () => {
  let component: XpWidgetComponent;
  let fixture: ComponentFixture<XpWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XpWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XpWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
