import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateChatDialogComponent } from './private-chat-dialog.component';

describe('PrivateChatDialogComponent', () => {
  let component: PrivateChatDialogComponent;
  let fixture: ComponentFixture<PrivateChatDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateChatDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateChatDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
