import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfficheGeneratorComponent } from './affiche-generator.component';

describe('AfficheGeneratorComponent', () => {
  let component: AfficheGeneratorComponent;
  let fixture: ComponentFixture<AfficheGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfficheGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AfficheGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
