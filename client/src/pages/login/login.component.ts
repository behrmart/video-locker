// client/src/pages/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="wrap">
    <div class="card">
      <h2>Iniciar sesión</h2>

      <form (ngSubmit)="onSubmit()" #f="ngForm">
        <label>
          <span>Usuario</span>
          <input
            name="username"
            [(ngModel)]="username"
            required
            autocomplete="username"
            placeholder="Tu usuario" />
        </label>

        <label>
          <span>Contraseña</span>
          <input
            name="password"
            [(ngModel)]="password"
            required
            type="password"
            autocomplete="current-password"
            placeholder="••••••••" />
        </label>

        <button [disabled]="loading || f.invalid">
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>

        <div class="msg error" *ngIf="error">{{ error }}</div>
      </form>

      <div class="hint">
        <b>Admin demo:</b> usuario <code>admin</code> / pass <code>admin123</code>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .wrap { min-height: calc(100dvh - 120px); display:grid; place-items:center; }
    .card { width:100%; max-width:360px; background:#fff; border-radius:16px; padding:18px 18px 14px;
            box-shadow:0 8px 24px rgba(0,0,0,.08); }
    h2 { margin:0 0 12px; }
    form { display:grid; gap:12px; }
    label { display:grid; gap:6px; }
    label span { font-size:12px; color:#555; }
    input { padding:10px 12px; border:1px solid #ddd; border-radius:10px; outline:none; }
    input:focus { border-color:#6f7bff; box-shadow:0 0 0 3px rgba(111,123,255,.15); }
    button { padding:10px 12px; border:1px solid #ddd; background:#111; color:#fff; border-radius:10px; cursor:pointer; }
    button[disabled] { opacity:.6; cursor:not-allowed; }
    .msg.error { color:#a40000; background:#ffecec; border:1px solid #ffc7c7; padding:8px 10px; border-radius:10px; }
    .hint { margin-top:10px; color:#666; font-size:12px; }
    code { background:#f3f3f7; padding:2px 6px; border-radius:6px; }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Si ya hay sesión activa, redirige directo
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/');
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.auth.finalizeLogin(res.token, res.user);
        this.loading = false;
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        console.error('Login error', e);
        this.error = e?.error?.error || 'Usuario o contraseña inválidos.';
        this.loading = false;
      }
    });
  }
}
