import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchRequestChatButtonComponent } from './match-request-chat-button.component';

describe('MatchRequestChatButtonComponent', () => {
  let component: MatchRequestChatButtonComponent;
  let fixture: ComponentFixture<MatchRequestChatButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRequestChatButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchRequestChatButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
