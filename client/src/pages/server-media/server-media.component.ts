import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ServerMediaItem } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type FilterOption = 'all' | 'video' | 'image' | 'audio';

@Component({
  standalone: true,
  selector: 'app-server-media',
  imports: [CommonModule],
  template: `
  <h2 class="title">Biblioteca del Servidor</h2>
  <p class="subtitle">Explora los archivos multimedia disponibles directamente en el servidor.</p>

  <section *ngIf="active" class="viewer">
    <header class="viewer-header">
      <div class="viewer-name">{{ active.name }}</div>
      <button type="button" class="viewer-close" (click)="clearActive()">×</button>
    </header>

    <ng-container [ngSwitch]="active.type">
      <video *ngSwitchCase="'video'" [src]="activeUrl" controls autoplay></video>
      <audio *ngSwitchCase="'audio'" [src]="activeUrl" controls autoplay></audio>
      <img *ngSwitchCase="'image'" [src]="activeUrl" [alt]="active.name">
      <div *ngSwitchDefault class="unsupported">Tipo no soportado</div>
    </ng-container>

    <div class="viewer-meta">
      <span>{{ active.mimeType }}</span>
      <span>{{ active.size | number }} bytes</span>
      <span>{{ active.modifiedAt | date:'medium' }}</span>
    </div>
  </section>

  <div class="toolbar">
    <span>Mostrar:</span>
    <button class="chip" [class.active]="filter === 'all'" (click)="setFilter('all')">Todo</button>
    <button class="chip" [class.active]="filter === 'video'" (click)="setFilter('video')">Videos</button>
    <button class="chip" [class.active]="filter === 'image'" (click)="setFilter('image')">Imágenes</button>
    <button class="chip" [class.active]="filter === 'audio'" (click)="setFilter('audio')">Audio</button>
  </div>

  <div *ngIf="loading" class="status">Cargando biblioteca…</div>
  <div *ngIf="!loading && filtered.length === 0" class="status">No se encontraron archivos compatibles.</div>

  <div *ngIf="!loading && filtered.length" class="grid">
    <button type="button" class="card" *ngFor="let media of filtered; trackBy: trackById" (click)="select(media)">
      <div class="name" title="{{ media.relativePath }}">{{ media.name }}</div>
      <div class="meta">{{ media.mimeType }} · {{ media.size | number }} bytes</div>
    </button>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .title { margin-bottom: 4px; }
    .subtitle { margin-top: 0; margin-bottom: 16px; color:#555; }
    .viewer {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 16px;
      background: #10131a;
      color: #eef2ff;
      box-shadow: 0 8px 24px rgba(15, 23, 42, .35);
      display: grid;
      gap: 12px;
    }
    .viewer-header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
    }
    .viewer-name {
      font-size: 18px;
      font-weight: 600;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .viewer-close {
      border:none;
      background:rgba(255,255,255,.1);
      color:#fff;
      width:32px;
      height:32px;
      border-radius:50%;
      cursor:pointer;
      font-size:20px;
      line-height:1;
    }
    .viewer-close:hover { background:rgba(255,255,255,.2); }
    .viewer video,
    .viewer audio,
    .viewer img {
      width:100%;
      border-radius:12px;
      background:#000;
      max-height:70vh;
      object-fit:contain;
    }
    .viewer-meta {
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      font-size:13px;
      opacity:.8;
    }
    .toolbar {
      display:flex; flex-wrap:wrap; gap:8px; align-items:center;
      margin-bottom: 16px;
    }
    .chip {
      border:none;
      padding:6px 12px;
      border-radius: 999px;
      background:#f5f5f5;
      cursor:pointer;
      transition: background .15s ease, color .15s ease;
    }
    .chip.active {
      background:#2e46d3;
      color:#fff;
    }
    .chip:hover { background:#e6e9fb; }

    .status { margin-top: 12px; opacity:.75; }

    .grid {
      display:grid;
      gap:12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 580px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 960px) {
      .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }

    .card {
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #fff;
      padding:10px 12px;
      display:grid;
      gap:4px;
      cursor:pointer;
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
      text-align:left;
      color:#111827;
    }
    .card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,.1);
      border-color:#c7d2fe;
    }
    .name {
      font-weight:600;
      font-size:13px;
      line-height:1.3;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .meta {
      color:#6b7280;
      font-size:11px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  `]
})
export class ServerMediaComponent implements OnInit {
  items: ServerMediaItem[] = [];
  filtered: ServerMediaItem[] = [];
  loading = true;
  filter: FilterOption = 'all';
  active: ServerMediaItem | null = null;
  activeUrl: string | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.listServerMedia().subscribe({
      next: (items) => {
        this.items = items;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('No se pudo obtener la biblioteca del servidor', err);
        this.items = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  setFilter(filter: FilterOption) {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter() {
    this.filtered = this.filter === 'all'
      ? this.items
      : this.items.filter(item => item.type === this.filter);
  }

  select(media: ServerMediaItem) {
    if (this.active?.id === media.id) return;
    this.active = media;
    this.activeUrl = this.streamUrl(media);
  }

  clearActive() {
    this.active = null;
    this.activeUrl = null;
  }

  streamUrl(item: ServerMediaItem) {
    const base = this.api.serverMediaStreamUrl(item.id);
    const token = this.auth.token;
    if (!token) return base;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }

  trackById(_index: number, item: ServerMediaItem) {
    return item.id;
  }
}
