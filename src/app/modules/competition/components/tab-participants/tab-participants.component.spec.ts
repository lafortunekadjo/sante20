import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabParticipantsComponent } from './tab-participants.component';

describe('TabParticipantsComponent', () => {
  let component: TabParticipantsComponent;
  let fixture: ComponentFixture<TabParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabParticipantsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
