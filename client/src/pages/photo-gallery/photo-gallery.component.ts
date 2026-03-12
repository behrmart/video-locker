import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Photo, Album } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-photo-gallery',
  imports: [CommonModule],
  template: `
  <h2 style="margin-bottom:12px">Galería de Fotos</h2>

  <section class="batch" *ngIf="isAdmin">
    <div class="batch-head">
      <button class="chip" (click)="toggleSelectionMode()">
        {{ selectionMode ? 'Cancelar selección' : 'Seleccionar fotos' }}
      </button>
      <span *ngIf="selectionMode" class="batch-count">{{ selectedIds.size }} seleccionadas</span>
    </div>

    <div class="batch-actions" *ngIf="selectionMode">
      <select [value]="targetAlbumId ?? ''" (change)="onTargetAlbumChange($event)">
        <option value="" disabled>Álbum destino</option>
        <option *ngFor="let album of albums; trackBy: trackByAlbumId" [value]="album.id">
          {{ album.name }}
        </option>
      </select>
      <button class="chip primary" (click)="assignSelectedToAlbum()">Asignar al álbum</button>
    </div>
    <div class="batch-msg" *ngIf="batchMsg">{{ batchMsg }}</div>
  </section>

  <div class="albums" *ngIf="!loading && albums.length">
    <button class="chip" [class.active]="selectedAlbumId === null" (click)="selectAlbum(null)">Todos</button>
    <button
      class="chip"
      *ngFor="let album of albums; trackBy: trackByAlbumId"
      [class.active]="selectedAlbumId === album.id"
      (click)="selectAlbum(album.id)">
      {{ album.name }} ({{ album.photoCount }})
    </button>
  </div>

  <div *ngIf="loading" class="grid">
    <div class="tile skeleton" *ngFor="let i of skeletons"></div>
  </div>

  <div *ngIf="!loading && photos.length === 0" class="empty">
    No hay fotos todavía. Sube algunas desde <b>Admin</b>.
  </div>

  <div *ngIf="!loading" class="grid">
    <div class="tile" *ngFor="let photo of photos; trackBy: trackById" (click)="onTileClick(photo)">
      <label class="selector" *ngIf="selectionMode" (click)="$event.stopPropagation()">
        <input type="checkbox" [checked]="selectedIds.has(photo.id)" (change)="toggleSelected(photo.id)">
      </label>
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
    .albums {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-bottom: 12px;
    }
    .batch {
      display:grid;
      gap:8px;
      margin-bottom: 12px;
      padding:10px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
      border-radius:10px;
    }
    .batch-head {
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
    }
    .batch-actions {
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
    }
    .batch-actions select {
      padding:6px 10px;
      border:1px solid #cbd5e1;
      border-radius:8px;
      background:#fff;
    }
    .batch-count { font-size:12px; color:#334155; }
    .batch-msg { font-size:12px; color:#475569; }
    .chip {
      border:none;
      background:#f1f5f9;
      color:#1f2937;
      border-radius:999px;
      padding:6px 10px;
      cursor:pointer;
      font-size:12px;
    }
    .chip.active {
      background:#1d4ed8;
      color:#fff;
    }
    .chip.primary {
      background:#1d4ed8;
      color:#fff;
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
    .selector {
      position:absolute;
      top:8px;
      left:8px;
      z-index:2;
      background:rgba(255,255,255,.9);
      border-radius:6px;
      padding:4px;
      line-height:1;
    }
    .selector input { width:16px; height:16px; }

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
  albums: Album[] = [];
  photos: Photo[] = [];
  srcMap: Record<number, string> = {};
  loading = true;
  skeletons = Array.from({ length: 10 });
  selectedPhoto: Photo | null = null;
  selectedUrl: string | null = null;
  selectedAlbumId: number | null = null;
  targetAlbumId: number | null = null;
  selectionMode = false;
  selectedIds = new Set<number>();
  batchMsg = '';
  isAdmin = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.computeIsAdmin();
    this.loading = true;
    this.api.listPhotoAlbums().subscribe({
      next: (albums) => { this.albums = albums; },
      error: (e) => console.error('No se pudieron cargar los álbumes', e)
    });
    this.loadPhotos();
  }

  ngOnDestroy(): void {
    Object.values(this.srcMap).forEach(url => URL.revokeObjectURL(url));
    this.srcMap = {};
  }

  trackById(_i: number, photo: Photo) { return photo.id; }
  trackByAlbumId(_i: number, album: Album) { return album.id; }

  onTileClick(photo: Photo) {
    if (this.selectionMode) {
      this.toggleSelected(photo.id);
      return;
    }
    this.open(photo);
  }

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

  selectAlbum(albumId: number | null) {
    if (this.selectedAlbumId === albumId) return;
    this.selectedAlbumId = albumId;
    this.loadPhotos();
  }

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    this.selectedIds.clear();
    this.targetAlbumId = null;
    this.batchMsg = '';
  }

  toggleSelected(photoId: number) {
    if (this.selectedIds.has(photoId)) this.selectedIds.delete(photoId);
    else this.selectedIds.add(photoId);
  }

  onTargetAlbumChange(ev: Event) {
    const value = (ev.target as HTMLSelectElement).value;
    const parsed = Number(value);
    this.targetAlbumId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  assignSelectedToAlbum() {
    if (!this.targetAlbumId) {
      this.batchMsg = 'Selecciona un álbum destino.';
      return;
    }
    const photoIds = Array.from(this.selectedIds);
    if (photoIds.length === 0) {
      this.batchMsg = 'Selecciona al menos una foto.';
      return;
    }

    this.batchMsg = 'Asignando fotos al álbum…';
    this.api.assignPhotosToAlbum(photoIds, this.targetAlbumId).subscribe({
      next: (resp) => {
        this.batchMsg = `Fotos actualizadas: ${resp.updated} ✅`;
        this.selectedIds.clear();
        this.loadPhotos();
        this.api.listPhotoAlbums().subscribe({
          next: albums => { this.albums = albums; },
          error: e => console.error('No se pudieron actualizar los álbumes', e)
        });
      },
      error: (e) => {
        console.error(e);
        this.batchMsg = e?.error?.error ? `No se pudo asignar: ${e.error.error}` : 'No se pudo asignar.';
      }
    });
  }

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

  private resetBlobs() {
    Object.values(this.srcMap).forEach(url => URL.revokeObjectURL(url));
    this.srcMap = {};
  }

  private loadPhotos() {
    this.loading = true;
    this.close();
    this.resetBlobs();
    this.selectedIds.clear();
    this.batchMsg = '';
    this.api.listPhotos(this.selectedAlbumId ?? undefined).subscribe({
      next: (items) => {
        this.photos = items;
        this.loading = false;
        this.photos.forEach(p => this.ensureBlob(p));
      },
      error: (e) => {
        console.error('No se pudo cargar la galería de fotos', e);
        this.photos = [];
        this.loading = false;
      }
    });
  }

  private computeIsAdmin(): boolean {
    const user = this.auth.user;
    if (user && user.role === 'ADMIN') return true;

    const payload = this.auth.payload;
    if (payload && String(payload['role']).toUpperCase() === 'ADMIN') return true;

    return false;
  }
}
