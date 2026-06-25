import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreeCaisseComponent } from './entree-caisse.component';

describe('EntreeCaisseComponent', () => {
  let component: EntreeCaisseComponent;
  let fixture: ComponentFixture<EntreeCaisseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntreeCaisseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntreeCaisseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
