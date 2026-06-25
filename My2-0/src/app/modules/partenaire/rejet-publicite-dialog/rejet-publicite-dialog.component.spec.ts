import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejetPubliciteDialogComponent } from './rejet-publicite-dialog.component';

describe('RejetPubliciteDialogComponent', () => {
  let component: RejetPubliciteDialogComponent;
  let fixture: ComponentFixture<RejetPubliciteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejetPubliciteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejetPubliciteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
