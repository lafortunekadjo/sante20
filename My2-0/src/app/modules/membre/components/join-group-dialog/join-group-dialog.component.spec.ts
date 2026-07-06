import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinGroupDialogComponent } from './join-group-dialog.component';

describe('JoinGroupDialogComponent', () => {
  let component: JoinGroupDialogComponent;
  let fixture: ComponentFixture<JoinGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGroupDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
