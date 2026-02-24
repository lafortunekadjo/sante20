import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartenaireLayoutComponent } from './partenaire-layout.component';

describe('PartenaireLayoutComponent', () => {
  let component: PartenaireLayoutComponent;
  let fixture: ComponentFixture<PartenaireLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartenaireLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartenaireLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
