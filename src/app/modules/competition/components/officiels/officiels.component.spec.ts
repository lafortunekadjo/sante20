import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficielsComponent } from './officiels.component';

describe('OfficielsComponent', () => {
  let component: OfficielsComponent;
  let fixture: ComponentFixture<OfficielsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficielsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficielsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
