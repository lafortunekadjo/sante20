import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteSidebarComponent } from './publicite-sidebar.component';

describe('PubliciteSidebarComponent', () => {
  let component: PubliciteSidebarComponent;
  let fixture: ComponentFixture<PubliciteSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
