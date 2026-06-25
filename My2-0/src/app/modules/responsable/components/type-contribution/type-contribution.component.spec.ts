import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeContributionComponent } from './type-contribution.component';

describe('TypeContributionComponent', () => {
  let component: TypeContributionComponent;
  let fixture: ComponentFixture<TypeContributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeContributionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeContributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
