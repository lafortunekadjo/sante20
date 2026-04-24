import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabStatistiquesComponent } from './tab-statistiques.component';

describe('TabStatistiquesComponent', () => {
  let component: TabStatistiquesComponent;
  let fixture: ComponentFixture<TabStatistiquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabStatistiquesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabStatistiquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
