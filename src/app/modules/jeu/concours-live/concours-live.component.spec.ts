import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcoursLiveComponent } from './concours-live.component';

describe('ConcoursLiveComponent', () => {
  let component: ConcoursLiveComponent;
  let fixture: ComponentFixture<ConcoursLiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcoursLiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcoursLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
