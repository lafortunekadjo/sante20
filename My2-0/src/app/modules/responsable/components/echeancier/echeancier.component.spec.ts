import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcheancierComponent } from './echeancier.component';

describe('EcheancierComponent', () => {
  let component: EcheancierComponent;
  let fixture: ComponentFixture<EcheancierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcheancierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcheancierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
