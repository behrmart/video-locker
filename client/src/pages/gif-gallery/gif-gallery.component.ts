import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Video } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-gif-gallery',
  imports: [CommonModule],
  template: `
  <h2 style="margin-bottom:12px">Galería de GIFs</h2>

  <div class="grid">
    <div class="tile" *ngFor="let v of gifs; trackBy: trackById" (click)="goTo(v.id)">
      <div class="thumb-wrap">
        <img *ngIf="srcMap[v.id]; else loadingTpl" [src]="srcMap[v.id]" alt="{{v.title}}" />
      </div>
      <div class="meta">
        <div class="title" title="{{v.title}}">{{ v.title }}</div>
        <div class="muted">{{ v.views }} vistas</div>
      </div>
    </div>
  </div>

  <ng-template #loadingTpl>
    <div class="loading">Cargando…</div>
  </ng-template>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: 1fr;     /* móvil: 1 columna */
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
    }
    .tile:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.12); }

    .thumb-wrap {
      position: relative;
      background: #f6f6f6;
      aspect-ratio: 16/9;             /* mantiene mosaico uniforme */
      display: flex; align-items: center; justify-content: center;
    }
    img {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .loading { opacity: .6; font-size: 14px; }

    .meta { padding: 10px 12px; }
    .title {
      font-weight: 600; font-size: 14px; line-height: 1.2;
      max-height: 2.4em; overflow: hidden;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .muted { color: #666; font-size: 12px; margin-top: 6px; }
  `]
})
export class GifGalleryComponent implements OnInit, OnDestroy {
  gifs: Video[] = [];
  // Mapa id -> blobURL (para poder revocar y no filtrar re-render)
  srcMap: Record<number, string> = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // 1) Trae todos los registros (ya protegidos por token)
    this.api.listVideos().subscribe({
      next: (all: Video[]) => {
        // 2) Filtra solo GIFs por mimeType
        this.gifs = all.filter(v => (v.mimeType || '').toLowerCase() === 'image/gif');

        // 3) Por cada GIF, pide el stream como Blob y crea blobURL
        this.gifs.forEach(v => {
          this.api.getStreamBlob(v.id).subscribe({
            next: (blob: Blob) => {
              // Liberar previo si existe
              if (this.srcMap[v.id]) URL.revokeObjectURL(this.srcMap[v.id]);
              this.srcMap[v.id] = URL.createObjectURL(blob);
            }
          });
        });
      },
      error: (e) => console.error('No se pudo cargar lista de GIFs', e)
    });
  }

  ngOnDestroy(): void {
    // Revoca todos los blob URLs
    Object.values(this.srcMap).forEach(url => URL.revokeObjectURL(url));
    this.srcMap = {};
  }

  trackById(_i: number, v: Video) { return v.id; }

  goTo(id: number) {
    // Navega al detalle (puedes cambiar a un visor de GIF si quieres)
    location.assign(`/video/${id}`);
  }
}
