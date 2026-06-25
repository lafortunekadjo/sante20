import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeSortieComponent } from './type-sortie.component';

describe('TypeSortieComponent', () => {
  let component: TypeSortieComponent;
  let fixture: ComponentFixture<TypeSortieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeSortieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeSortieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
