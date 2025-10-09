// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <header class="header">
    <a class="brand" routerLink="/">Video Locker</a>

    <nav class="nav">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Videos</a>
      <a routerLink="/gifs" routerLinkActive="active">GIFs</a>
      <a routerLink="/photos" routerLinkActive="active">Fotos</a>
      <a routerLink="/admin" routerLinkActive="active">Admin</a>

      <ng-container *ngIf="auth.isLoggedIn(); else loginLink">
        <button class="btn" (click)="logout()">Cerrar sesión</button>
      </ng-container>
      <ng-template #loginLink>
        <a routerLink="/login" routerLinkActive="active">Login</a>
      </ng-template>
    </nav>
  </header>

  <main class="container">
    <router-outlet/>
  </main>
  `,
  styles: [`
    :host { display:block; color:#222; font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }
    .header{
      position: sticky; top:0; z-index: 10;
      display:flex; justify-content:space-between; align-items:center;
      padding:12px 18px; background:#fff;
      box-shadow:0 1px 6px rgba(0,0,0,.08);
    }
    .brand{ font-weight:700; text-decoration:none; color:#111; letter-spacing:.2px; }
    .nav { display:flex; align-items:center; gap:12px; }
    .nav a { text-decoration:none; color:#333; padding:6px 8px; border-radius:10px; }
    .nav a.active { background:#f0f3ff; color:#2e46d3; }
    .btn{
      border:1px solid #ddd; background:#fff; padding:6px 10px; border-radius:10px; cursor:pointer;
      transition: background .15s ease, box-shadow .15s ease;
    }
    .btn:hover { background:#f7f7f7; box-shadow:0 1px 6px rgba(0,0,0,.07); }
    .container{ padding:16px; max-width:1100px; margin:0 auto; }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
  logout(){ this.auth.logout(); this.router.navigateByUrl('/login'); }
}
