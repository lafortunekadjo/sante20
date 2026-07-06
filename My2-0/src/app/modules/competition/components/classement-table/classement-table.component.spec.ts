import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassementTableComponent } from './classement-table.component';

describe('ClassementTableComponent', () => {
  let component: ClassementTableComponent;
  let fixture: ComponentFixture<ClassementTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassementTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassementTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
