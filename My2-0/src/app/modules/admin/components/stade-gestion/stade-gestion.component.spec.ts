import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StadeGestionComponent } from './stade-gestion.component';

describe('StadeGestionComponent', () => {
  let component: StadeGestionComponent;
  let fixture: ComponentFixture<StadeGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StadeGestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StadeGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
