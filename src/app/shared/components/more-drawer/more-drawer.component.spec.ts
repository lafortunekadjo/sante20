import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreDrawerComponent } from './more-drawer.component';

describe('MoreDrawerComponent', () => {
  let component: MoreDrawerComponent;
  let fixture: ComponentFixture<MoreDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoreDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
