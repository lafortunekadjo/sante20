import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoManagementComponent } from './video-management.component';

describe('VideoManagementComponent', () => {
  let component: VideoManagementComponent;
  let fixture: ComponentFixture<VideoManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
