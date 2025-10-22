// src/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },

  // Galería GIFs
  { path: 'gifs', canActivate: [authGuard], loadComponent: () => import('./pages/gif-gallery/gif-gallery.component').then(m => m.GifGalleryComponent) },

  // Galería de videos (home)
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/gallery/gallery.component').then(m => m.GalleryComponent) },

  // Galería de fotos
  { path: 'photos', canActivate: [authGuard], loadComponent: () => import('./pages/photo-gallery/photo-gallery.component').then(m => m.PhotoGalleryComponent) },

  // Media externa del servidor
  { path: 'server-media', canActivate: [authGuard], loadComponent: () => import('./pages/server-media/server-media.component').then(m => m.ServerMediaComponent) },

  // Detalle
  { path: 'video/:id', canActivate: [authGuard], loadComponent: () => import('./pages/video-detail/video-detail.component').then(m => m.VideoDetailComponent) },

  // Admin
  { path: 'admin', canActivate: [authGuard], loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },

  { path: '**', redirectTo: '' }
];
