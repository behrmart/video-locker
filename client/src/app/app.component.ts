import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';

/* Material */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
  <mat-toolbar color="primary" class="toolbar">
    <a routerLink="/" class="brand"><mat-icon>movie</mat-icon>&nbsp;Video Locker</a>
    <span class="spacer"></span>
    <a mat-button routerLink="/">Galería</a>
    <a mat-button routerLink="/admin">Admin</a>
    <a *ngIf="!auth.isLoggedIn()" mat-raised-button color="accent" routerLink="/login">Login</a>
    <button *ngIf="auth.isLoggedIn()" mat-raised-button (click)="logout()">
      <mat-icon>logout</mat-icon>&nbsp;Salir
    </button>
  </mat-toolbar>
  <main class="container"><router-outlet/></main>
  `,
  styles: [`
    .toolbar { position: sticky; top:0; z-index: 100; }
    .brand { text-decoration: none; display:flex; align-items:center; font-weight:700; }
    .spacer { flex:1 1 auto; }
    .container { padding: 16px; max-width: 1100px; margin: 0 auto; }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
  logout(){ this.auth.logout(); }
}
