import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPublicitesListComponent } from './admin-publicites-list.component';

describe('AdminPublicitesListComponent', () => {
  let component: AdminPublicitesListComponent;
  let fixture: ComponentFixture<AdminPublicitesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPublicitesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPublicitesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
