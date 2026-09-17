import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassementPublicComponent } from './classement-public.component';

describe('ClassementPublicComponent', () => {
  let component: ClassementPublicComponent;
  let fixture: ComponentFixture<ClassementPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassementPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassementPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
