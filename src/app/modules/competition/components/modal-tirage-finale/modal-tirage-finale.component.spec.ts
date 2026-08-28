import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTirageFinaleComponent } from './modal-tirage-finale.component';

describe('ModalTirageFinaleComponent', () => {
  let component: ModalTirageFinaleComponent;
  let fixture: ComponentFixture<ModalTirageFinaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTirageFinaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalTirageFinaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
