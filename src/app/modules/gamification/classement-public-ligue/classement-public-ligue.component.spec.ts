import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassementPublicLigueComponent } from './classement-public-ligue.component';

describe('ClassementPublicLigueComponent', () => {
  let component: ClassementPublicLigueComponent;
  let fixture: ComponentFixture<ClassementPublicLigueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassementPublicLigueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassementPublicLigueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
