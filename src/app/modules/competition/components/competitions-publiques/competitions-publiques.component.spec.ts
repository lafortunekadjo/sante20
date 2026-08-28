import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionsPubliquesComponent } from './competitions-publiques.component';

describe('CompetitionsPubliquesComponent', () => {
  let component: CompetitionsPubliquesComponent;
  let fixture: ComponentFixture<CompetitionsPubliquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitionsPubliquesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitionsPubliquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
