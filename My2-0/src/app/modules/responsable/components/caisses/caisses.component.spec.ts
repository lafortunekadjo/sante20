import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaissesComponent } from './caisses.component';

describe('CaissesComponent', () => {
  let component: CaissesComponent;
  let fixture: ComponentFixture<CaissesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaissesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaissesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
