import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcoursPublicComponent } from './concours-public.component';

describe('ConcoursPublicComponent', () => {
  let component: ConcoursPublicComponent;
  let fixture: ComponentFixture<ConcoursPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcoursPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcoursPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
