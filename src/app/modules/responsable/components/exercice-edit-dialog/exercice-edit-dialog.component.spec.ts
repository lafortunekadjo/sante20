import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceEditDialogComponent } from './exercice-edit-dialog.component';

describe('ExerciceEditDialogComponent', () => {
  let component: ExerciceEditDialogComponent;
  let fixture: ComponentFixture<ExerciceEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
