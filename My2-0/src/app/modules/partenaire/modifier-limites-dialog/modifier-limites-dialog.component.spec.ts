import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierLimitesDialogComponent } from './modifier-limites-dialog.component';

describe('ModifierLimitesDialogComponent', () => {
  let component: ModifierLimitesDialogComponent;
  let fixture: ComponentFixture<ModifierLimitesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierLimitesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierLimitesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
