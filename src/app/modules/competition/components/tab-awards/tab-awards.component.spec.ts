import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabAwardsComponent } from './tab-awards.component';

describe('TabAwardsComponent', () => {
  let component: TabAwardsComponent;
  let fixture: ComponentFixture<TabAwardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAwardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabAwardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
