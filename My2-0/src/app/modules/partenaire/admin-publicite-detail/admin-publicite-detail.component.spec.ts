import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPubliciteDetailComponent } from './admin-publicite-detail.component';

describe('AdminPubliciteDetailComponent', () => {
  let component: AdminPubliciteDetailComponent;
  let fixture: ComponentFixture<AdminPubliciteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPubliciteDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPubliciteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
