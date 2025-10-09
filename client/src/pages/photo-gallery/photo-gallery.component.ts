import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Photo } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-photo-gallery',
  imports: [CommonModule],
  template: `
  <h2 style="margin-bottom:12px">Galería de Fotos</h2>

  <div *ngIf="loading" class="grid">
    <div class="tile skeleton" *ngFor="let i of skeletons"></div>
  </div>

  <div *ngIf="!loading && photos.length === 0" class="empty">
    No hay fotos todavía. Sube algunas desde <b>Admin</b>.
  </div>

  <div *ngIf="!loading" class="grid">
    <div class="tile" *ngFor="let photo of photos; trackBy: trackById" (click)="open(photo)">
      <ng-container *ngIf="srcMap[photo.id]; else loadingTpl">
        <img [src]="srcMap[photo.id]" [alt]="photo.title" />
      </ng-container>
    </div>
  </div>

  <ng-template #loadingTpl>
    <div class="placeholder">Cargando…</div>
  </ng-template>

  <div class="overlay" *ngIf="selectedPhoto" (click)="close()">
    <div class="overlay-content" (click)="$event.stopPropagation()">
      <button class="close" type="button" (click)="close()">×</button>
      <img *ngIf="selectedUrl" [src]="selectedUrl" [alt]="selectedPhoto?.title">
      <div class="caption">
        <h3>{{ selectedPhoto?.title }}</h3>
        <div class="meta">{{ selectedPhoto?.mimeType }} · {{ selectedPhoto?.createdAt | date:'medium' }}</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 992px) {
      .grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }

    .tile {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .tile:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.12); }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .placeholder {
      width: 100%;
      height: 100%;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#666;
      font-size:14px;
    }

    .skeleton {
      background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%);
      background-size: 400% 100%;
      animation: shimmer 1.2s infinite;
      aspect-ratio: 1/1;
      border-radius: 12px;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    .empty { opacity:.7; margin-top: 8px; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.75);
      display: grid;
      place-items: center;
      padding: 24px;
      z-index: 100;
    }
    .overlay-content {
      position: relative;
      max-width: min(960px, 100%);
      max-height: calc(100vh - 80px);
      background: #111;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 10px 32px rgba(0,0,0,.3);
      display: grid;
      gap: 12px;
      justify-items: center;
    }
    .overlay-content img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 12px;
      background:#000;
    }
    .caption {
      color: #f0f0f0;
      text-align: center;
    }
    .caption h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .meta {
      font-size: 13px;
      opacity: .7;
      margin-top: 4px;
    }
    .close {
      position: absolute;
      top: 12px;
      right: 12px;
      border: none;
      background: rgba(0,0,0,.6);
      color: #fff;
      font-size: 22px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      line-height: 1;
    }
    .close:hover { background: rgba(0,0,0,.8); }
  `]
})
export class PhotoGalleryComponent implements OnInit, OnDestroy {
  photos: Photo[] = [];
  srcMap: Record<number, string> = {};
  loading = true;
  skeletons = Array.from({ length: 10 });
  selectedPhoto: Photo | null = null;
  selectedUrl: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listPhotos().subscribe({
      next: (items) => {
        this.photos = items;
        this.loading = false;
        this.photos.forEach(p => this.ensureBlob(p));
      },
      error: (e) => {
        console.error('No se pudo cargar la galería de fotos', e);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    Object.values(this.srcMap).forEach(url => URL.revokeObjectURL(url));
    this.srcMap = {};
  }

  trackById(_i: number, photo: Photo) { return photo.id; }

  open(photo: Photo) {
    this.ensureBlob(photo);
    this.selectedPhoto = photo;
    this.selectedUrl = this.srcMap[photo.id] || null;
  }

  close() {
    this.selectedPhoto = null;
    this.selectedUrl = null;
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.selectedPhoto) this.close(); }

  private ensureBlob(photo: Photo) {
    if (this.srcMap[photo.id]) return;
    this.api.getPhotoBlob(photo.id).subscribe({
      next: (blob) => {
        if (this.srcMap[photo.id]) URL.revokeObjectURL(this.srcMap[photo.id]);
        this.srcMap[photo.id] = URL.createObjectURL(blob);
        if (this.selectedPhoto?.id === photo.id) {
          this.selectedUrl = this.srcMap[photo.id];
        }
      },
      error: (e) => console.error(`No se pudo cargar foto ${photo.id}`, e)
    });
  }
}
