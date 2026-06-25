import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberstatComponent } from './memberstat.component';

describe('MemberstatComponent', () => {
  let component: MemberstatComponent;
  let fixture: ComponentFixture<MemberstatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberstatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberstatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
