// client/src/pages/gallery/gallery.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Video } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule],
  template: `
  <h2 style="margin-bottom:12px">Galería de Videos</h2>

  <div *ngIf="loading" class="grid">
    <div class="tile skeleton" *ngFor="let i of skeletons"></div>
  </div>

  <div *ngIf="!loading && videos.length === 0" class="empty">
    No hay videos todavía. Sube alguno desde <b>Admin</b>.
  </div>

  <div *ngIf="!loading" class="grid">
    <div class="tile" *ngFor="let v of videos; trackBy: trackById" (click)="goTo(v.id)" title="{{v.title}}">
      <div class="thumb-wrap">
        <!-- Placeholder/overlay de play -->
        <div class="thumb">
          <svg class="play" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30"></circle>
            <polygon points="26,20 26,44 46,32"></polygon>
          </svg>
        </div>
      </div>
      <div class="meta">
        <div class="title">{{ v.title }}</div>
        <div class="muted">{{ v.views }} vistas · {{ v.mimeType }}</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .grid {
      display: grid;
      grid-template-columns: 1fr;     /* móvil: 1 */
      gap: 12px;
    }
    @media (min-width: 600px) {
      .grid { grid-template-columns: repeat(2, 1fr); }  /* tablet chica: 2 */
    }
    @media (min-width: 1024px) {
      .grid { grid-template-columns: repeat(4, 1fr); }  /* laptop: 4 */
    }

    .tile {
      cursor: pointer;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
      background: #fff;
      display: flex;
      flex-direction: column;
      transition: transform .15s ease, box-shadow .15s ease;
      min-height: 220px;
    }
    .tile:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.12); }

    .thumb-wrap { background: #f5f7fb; aspect-ratio: 16/9; display:flex; align-items:center; justify-content:center; }
    .thumb { position: relative; width: 100%; height: 100%; display:flex; align-items:center; justify-content:center; }
    .play { width: 64px; height: 64px; opacity: .9; }
    .play circle { fill: rgba(0,0,0,.35); }
    .play polygon { fill: #fff; }

    .meta { padding: 10px 12px; }
    .title {
      font-weight: 600; font-size: 14px; line-height: 1.2;
      max-height: 2.4em; overflow: hidden;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .muted { color: #666; font-size: 12px; margin-top: 6px; }

    /* Skeleton loading tiles */
    .skeleton { background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%); background-size: 400% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% {background-position: 100% 0;} 100% {background-position: -100% 0;} }

    .empty { opacity:.7; margin-top: 8px; }
  `]
})
export class GalleryComponent implements OnInit {
  videos: Video[] = [];
  loading = true;
  skeletons = Array.from({ length: 8 });

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.listVideos().subscribe({
      next: (all) => {
        // Sólo tipos de video (evitamos GIFs aquí)
        this.videos = all.filter(v => (v.mimeType || '').toLowerCase().startsWith('video/'));
        this.loading = false;
      },
      error: (e) => {
        console.error('No se pudo cargar la galería de videos', e);
        this.loading = false;
      }
    });
  }

  trackById(_i: number, v: Video) { return v.id; }

  goTo(id: number) { this.router.navigate(['/video', id]); }
}
