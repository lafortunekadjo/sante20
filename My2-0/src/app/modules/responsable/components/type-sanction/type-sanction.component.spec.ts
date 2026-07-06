import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeSanctionComponent } from './type-sanction.component';

describe('TypeSanctionComponent', () => {
  let component: TypeSanctionComponent;
  let fixture: ComponentFixture<TypeSanctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeSanctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeSanctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
