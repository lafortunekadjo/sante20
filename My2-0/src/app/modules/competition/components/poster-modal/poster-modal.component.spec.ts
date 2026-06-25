import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosterModalComponent } from './poster-modal.component';

describe('PosterModalComponent', () => {
  let component: PosterModalComponent;
  let fixture: ComponentFixture<PosterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
