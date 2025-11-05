import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit{

  loginForm: FormGroup;
  isLoading = false;


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private dialog: MatDialog) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    console.log("apres")
    this.isLoading = false;
     this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

submit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe({
        next: (response) => {
          if (this.authService.isPasswordResetRequired()) {
            this.dialog.open(PasswordResetDialogComponent);
            this.isLoading = false;
          } else {
            const roles = this.authService.getRoles();
            console.log('Rôles de l\'utilisateur:', roles);
            this.isLoading = false;
            if (roles.includes('ADMIN')) {
              this.router.navigate(['/admin']);
            } else if (roles.includes('RESPONSABLE')) {
              this.router.navigate(['/responsable']);
            } else if (roles.includes('MEMBRE')) {
              console.log('Connexion réussie');
              this.router.navigate(['/membre2']);
            } else {
              this.router.navigate(['/login']);
            }
          }
        },
        error: (err) => {
          console.error('Erreur de connexion:', err);
           this.isLoading = false;
          // Utilisez une boîte de dialogue personnalisée au lieu d'alert()
          // Exemple: this.dialogService.openErrorDialog('Échec de la connexion. Vérifiez vos identifiants.');
          alert('Échec de la connexion. Vérifiez vos identifiants.');
        }
      });
    }
  }

  

}
