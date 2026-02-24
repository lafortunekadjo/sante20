import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubliciteAffichageComponent } from './publicite-affichage.component';

describe('PubliciteAffichageComponent', () => {
  let component: PubliciteAffichageComponent;
  let fixture: ComponentFixture<PubliciteAffichageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PubliciteAffichageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PubliciteAffichageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
