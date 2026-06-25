import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipeMembersDialogComponent } from './equipe-members-dialog.component';

describe('EquipeMembersDialogComponent', () => {
  let component: EquipeMembersDialogComponent;
  let fixture: ComponentFixture<EquipeMembersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipeMembersDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipeMembersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
