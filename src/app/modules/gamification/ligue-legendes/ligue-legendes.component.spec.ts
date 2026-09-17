import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LigueLegendesComponent } from './ligue-legendes.component';

describe('LigueLegendesComponent', () => {
  let component: LigueLegendesComponent;
  let fixture: ComponentFixture<LigueLegendesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LigueLegendesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LigueLegendesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
