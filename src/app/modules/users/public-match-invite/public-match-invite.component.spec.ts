import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicMatchInviteComponent } from './public-match-invite.component';

describe('PublicMatchInviteComponent', () => {
  let component: PublicMatchInviteComponent;
  let fixture: ComponentFixture<PublicMatchInviteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicMatchInviteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicMatchInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
