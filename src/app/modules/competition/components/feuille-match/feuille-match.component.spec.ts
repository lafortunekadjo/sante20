import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeuilleMatchComponent } from './feuille-match.component';

describe('FeuilleMatchComponent', () => {
  let component: FeuilleMatchComponent;
  let fixture: ComponentFixture<FeuilleMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeuilleMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeuilleMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
