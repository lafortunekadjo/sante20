import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabResumeComponent } from './tab-resume.component';

describe('TabResumeComponent', () => {
  let component: TabResumeComponent;
  let fixture: ComponentFixture<TabResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabResumeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
