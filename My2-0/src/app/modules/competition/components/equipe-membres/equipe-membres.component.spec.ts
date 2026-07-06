import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipeMembresComponent } from './equipe-membres.component';

describe('EquipeMembresComponent', () => {
  let component: EquipeMembresComponent;
  let fixture: ComponentFixture<EquipeMembresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipeMembresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipeMembresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
