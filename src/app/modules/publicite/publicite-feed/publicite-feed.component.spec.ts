import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteFeedComponent } from './publicite-feed.component';

describe('PubliciteFeedComponent', () => {
  let component: PubliciteFeedComponent;
  let fixture: ComponentFixture<PubliciteFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteFeedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
