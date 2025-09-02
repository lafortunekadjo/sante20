import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileImageEditDialogComponent } from './profile-image-edit-dialog.component';

describe('ProfileImageEditDialogComponent', () => {
  let component: ProfileImageEditDialogComponent;
  let fixture: ComponentFixture<ProfileImageEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileImageEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileImageEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
