import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupeFormDialogComponent } from './groupe-form-dialog.component';

describe('GroupeFormDialogComponent', () => {
  let component: GroupeFormDialogComponent;
  let fixture: ComponentFixture<GroupeFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupeFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupeFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
