import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TirageExportDialogComponent } from './tirage-export-dialog.component';

describe('TirageExportDialogComponent', () => {
  let component: TirageExportDialogComponent;
  let fixture: ComponentFixture<TirageExportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TirageExportDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TirageExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
