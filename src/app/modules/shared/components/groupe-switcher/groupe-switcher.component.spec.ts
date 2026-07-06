import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupeSwitcherComponent } from './groupe-switcher.component';

describe('GroupeSwitcherComponent', () => {
  let component: GroupeSwitcherComponent;
  let fixture: ComponentFixture<GroupeSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupeSwitcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupeSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
