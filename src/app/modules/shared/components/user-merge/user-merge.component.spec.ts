import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMergeComponent } from './user-merge.component';

describe('UserMergeComponent', () => {
  let component: UserMergeComponent;
  let fixture: ComponentFixture<UserMergeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMergeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMergeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
