import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabPhasesComponent } from './tab-phases.component';

describe('TabPhasesComponent', () => {
  let component: TabPhasesComponent;
  let fixture: ComponentFixture<TabPhasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPhasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabPhasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
