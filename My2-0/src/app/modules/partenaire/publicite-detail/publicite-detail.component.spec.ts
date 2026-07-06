import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteDetailComponent } from './publicite-detail.component';

describe('PubliciteDetailComponent', () => {
  let component: PubliciteDetailComponent;
  let fixture: ComponentFixture<PubliciteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
