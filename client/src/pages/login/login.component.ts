import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/* Material */
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatIconModule }      from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule
  ],
  template: `
  <div class="wrap">
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Iniciar sesión</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Usuario</mat-label>
            <input matInput [(ngModel)]="username" name="username" required autocomplete="username">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Contraseña</mat-label>
            <input matInput [(ngModel)]="password" name="password" type="password" required autocomplete="current-password">
          </mat-form-field>

          <button mat-raised-button color="primary" class="full">Entrar</button>
        </form>
      </mat-card-content>
    </mat-card>
  </div>
  `,
  styles: [`
    .wrap { display:grid; place-items:center; min-height:70vh; padding:16px; }
    .form { display:grid; gap:12px; width:320px; max-width:90vw; }
    .full { width:100%; }
  `]
})
export class LoginComponent {
  username = ''; password = '';
  constructor(private auth: AuthService, private router: Router, private sb: MatSnackBar) {}
  submit(){
    this.auth.login(this.username, this.password).subscribe({
      next: (res)=>{ this.auth.token = res.token; this.sb.open('Bienvenido ✨', 'OK', { duration: 2000 }); this.router.navigateByUrl('/'); },
      error: (e)=>{ this.sb.open(e?.error?.error || 'Error de login', 'OK', { duration: 3000 }); }
    });
  }
}
