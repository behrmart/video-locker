// src/app.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
selector: 'app-root',
standalone: true,
imports: [RouterOutlet, RouterLink],
template: `
<header class="header">
<a routerLink="/">Video Locker</a>
<nav>
<a routerLink="/">Galería</a>
<a routerLink="/admin">Admin</a>
<a routerLink="/login">Login</a>
</nav>
</header>
<main class="container"><router-outlet/></main>`,
styles: [`.header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;box-shadow:0 1px 4px rgba(0,0,0,.08)}.container{padding:16px;max-width:1000px;margin:0 auto} nav a{margin-left:12px}`]
})
export class AppComponent {}