import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private dialog: MatDialog) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

 submit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe({
        next: (response) => {
          // Logique de redirection après la connexion réussie
          // 1. D'abord, vérifiez si le mot de passe doit être réinitialisé
          if (this.authService.isPasswordResetRequired()) {
            console.log("Le mot de passe doit être réinitialisé. Redirection vers la page de réinitialisation.");
            this.dialog.open(PasswordResetDialogComponent)
            // this.router.navigate(['/reset-password']); // Rediriger vers un nouveau chemin de composant
          } else {
            // 2. Si le mot de passe n'a pas besoin d'être réinitialisé, redirigez en fonction des rôles
            const roles = this.authService.getRoles();
            console.log(roles);
            if (roles.includes('ADMIN')) {
              this.router.navigate(['/admin']);
            } else if (roles.includes('RESPONSABLE')) {
              this.router.navigate(['/responsable']);
            } else if (roles.includes('USER')) {
              console.log('Connexion réussie');
              this.router.navigate(['/membre']);
            } else {
              this.router.navigate(['/login']);
            }
          }
        },
        error: (err) => {
          console.error('Erreur de connexion:', err);
          // Utilisez une boîte de dialogue personnalisée au lieu d'alert()
          // Exemple: this.dialogService.openErrorDialog('Échec de la connexion. Vérifiez vos identifiants.');
          alert('Échec de la connexion. Vérifiez vos identifiants.');
        }
      });
    }
  }

  

}
