import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabTirageComponent } from './tab-tirage.component';

describe('TabTirageComponent', () => {
  let component: TabTirageComponent;
  let fixture: ComponentFixture<TabTirageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTirageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabTirageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
