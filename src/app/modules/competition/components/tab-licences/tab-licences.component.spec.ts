import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabLicencesComponent } from './tab-licences.component';

describe('TabLicencesComponent', () => {
  let component: TabLicencesComponent;
  let fixture: ComponentFixture<TabLicencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabLicencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabLicencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
