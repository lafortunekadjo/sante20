import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementAdminComponent } from './announcement-admin.component';

describe('AnnouncementAdminComponent', () => {
  let component: AnnouncementAdminComponent;
  let fixture: ComponentFixture<AnnouncementAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
