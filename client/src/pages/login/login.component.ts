// src/pages/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
  <div class="wrap">
    <h2>Iniciar sesión</h2>
    <form (ngSubmit)="submit()" class="form">
      <input [(ngModel)]="username" name="username" placeholder="Usuario" required>
      <input [(ngModel)]="password" name="password" type="password" placeholder="Contraseña" required>
      <button>Entrar</button>
    </form>
  </div>
  `,
  styles:[`.wrap{max-width:360px;margin:48px auto;padding:0 12px}.form{display:grid;gap:12px}`]
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private sb: MatSnackBar
  ) {
    // Si viene ?expired=1, mostramos snackbar al entrar
    this.route.queryParamMap.subscribe(p => {
      if (p.get('expired') === '1') {
        // pequeño delay para asegurar que el view está montado
        setTimeout(() => this.sb.open('Sesión expirada. Vuelve a iniciar sesión.', 'OK', { duration: 3000 }), 0);
      }
    });
  }

  submit() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        this.auth.finalizeLogin(res.token);
        this.sb.open('Bienvenido ✨', 'OK', { duration: 2000 });
        this.router.navigateByUrl('/');
      },
      error: () => this.sb.open('Usuario o contraseña inválidos', 'Cerrar', { duration: 2500 })
    });
  }
}


