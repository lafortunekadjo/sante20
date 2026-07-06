import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPreviewDialogComponent } from './media-preview-dialog.component';

describe('MediaPreviewDialogComponent', () => {
  let component: MediaPreviewDialogComponent;
  let fixture: ComponentFixture<MediaPreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPreviewDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
