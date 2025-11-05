import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortieCaisseComponent } from './sortie-caisse.component';

describe('SortieCaisseComponent', () => {
  let component: SortieCaisseComponent;
  let fixture: ComponentFixture<SortieCaisseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortieCaisseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortieCaisseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
