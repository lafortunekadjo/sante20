import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupRegisterComponent } from './user-group-register.component';

describe('UserGroupRegisterComponent', () => {
  let component: UserGroupRegisterComponent;
  let fixture: ComponentFixture<UserGroupRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserGroupRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserGroupRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
