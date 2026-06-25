import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SanctionFormComponent } from './sanction-form.component';

describe('SanctionFormComponent', () => {
  let component: SanctionFormComponent;
  let fixture: ComponentFixture<SanctionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SanctionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SanctionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
