import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreprisesListComponent } from './entreprises-list.component';

describe('EntreprisesListComponent', () => {
  let component: EntreprisesListComponent;
  let fixture: ComponentFixture<EntreprisesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntreprisesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntreprisesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
