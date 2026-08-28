import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabAccesComponent } from './tab-acces.component';

describe('TabAccesComponent', () => {
  let component: TabAccesComponent;
  let fixture: ComponentFixture<TabAccesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAccesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabAccesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
