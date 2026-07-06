import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcoursadminComponent } from './concoursadmin.component';

describe('ConcoursadminComponent', () => {
  let component: ConcoursadminComponent;
  let fixture: ComponentFixture<ConcoursadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcoursadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcoursadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
