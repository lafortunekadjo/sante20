import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeDepenseComponent } from './type-depense.component';

describe('TypeDepenseComponent', () => {
  let component: TypeDepenseComponent;
  let fixture: ComponentFixture<TypeDepenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeDepenseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeDepenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
