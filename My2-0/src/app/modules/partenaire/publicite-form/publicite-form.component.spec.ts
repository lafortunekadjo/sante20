import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteFormComponent } from './publicite-form.component';

describe('PubliciteFormComponent', () => {
  let component: PubliciteFormComponent;
  let fixture: ComponentFixture<PubliciteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
