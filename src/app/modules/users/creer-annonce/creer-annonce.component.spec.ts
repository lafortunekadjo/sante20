import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreerAnnonceComponent } from './creer-annonce.component';

describe('CreerAnnonceComponent', () => {
  let component: CreerAnnonceComponent;
  let fixture: ComponentFixture<CreerAnnonceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreerAnnonceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreerAnnonceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
