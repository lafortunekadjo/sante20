import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityPolicyComponent } from './security-policy.component';

describe('SecurityPolicyComponent', () => {
  let component: SecurityPolicyComponent;
  let fixture: ComponentFixture<SecurityPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
