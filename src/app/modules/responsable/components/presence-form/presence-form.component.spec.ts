import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenceFormComponent } from './presence-form.component';

describe('PresenceFormComponent', () => {
  let component: PresenceFormComponent;
  let fixture: ComponentFixture<PresenceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresenceFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresenceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
