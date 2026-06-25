import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterUtilisateurDialogComponent } from './ajouter-utilisateur-dialog.component';

describe('AjouterUtilisateurDialogComponent', () => {
  let component: AjouterUtilisateurDialogComponent;
  let fixture: ComponentFixture<AjouterUtilisateurDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterUtilisateurDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterUtilisateurDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
