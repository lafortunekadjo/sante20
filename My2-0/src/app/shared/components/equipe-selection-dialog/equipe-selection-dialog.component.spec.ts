import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipeSelectionDialogComponent } from './equipe-selection-dialog.component';

describe('EquipeSelectionDialogComponent', () => {
  let component: EquipeSelectionDialogComponent;
  let fixture: ComponentFixture<EquipeSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipeSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipeSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
