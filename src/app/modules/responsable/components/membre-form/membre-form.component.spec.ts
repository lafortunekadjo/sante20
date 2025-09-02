import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembreFormComponent } from './membre-form.component';

describe('MembreFormComponent', () => {
  let component: MembreFormComponent;
  let fixture: ComponentFixture<MembreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembreFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
