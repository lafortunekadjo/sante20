import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupeDetailsDialogComponent } from './groupe-details-dialog.component';

describe('GroupeDetailsDialogComponent', () => {
  let component: GroupeDetailsDialogComponent;
  let fixture: ComponentFixture<GroupeDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupeDetailsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupeDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
