import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaisseDetailComponent } from './caisse-detail.component';

describe('CaisseDetailComponent', () => {
  let component: CaisseDetailComponent;
  let fixture: ComponentFixture<CaisseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaisseDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaisseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
