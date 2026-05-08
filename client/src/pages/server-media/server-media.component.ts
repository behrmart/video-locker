import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ServerMediaGallery, ServerMediaItem } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type FilterOption = 'all' | 'video' | 'image' | 'audio';

interface GalleryCard {
  gallery: ServerMediaGallery;
  mediaCount: number;
  subgalleryCount: number;
}

@Component({
  standalone: true,
  selector: 'app-server-media',
  imports: [CommonModule],
  template: `
  <h2 class="title">Biblioteca del Servidor</h2>
  <p class="subtitle">Explora las carpetas dentro del servidor como galerías y subgalerías multimedia.</p>

  <section *ngIf="!loading && rootGallery" class="browser">
    <div class="breadcrumbs">
      <button type="button" class="crumb" [class.active]="galleryPath.length === 0" (click)="goToRoot()">Inicio</button>
      <ng-container *ngFor="let gallery of galleryPath; let i = index">
        <span class="crumb-sep">/</span>
        <button
          type="button"
          class="crumb"
          [class.active]="i === galleryPath.length - 1"
          (click)="goToGallery(i)">
          {{ gallery.name }}
        </button>
      </ng-container>
    </div>

    <div class="browser-head">
      <div>
        <div class="browser-title">{{ currentGalleryName }}</div>
        <div class="browser-meta">
          {{ visibleGalleries.length }} galerías · {{ visibleItems.length }} archivos
          <span *ngIf="filter !== 'all'"> · {{ filterLabel }}</span>
        </div>
      </div>

      <button *ngIf="galleryPath.length" type="button" class="back-button" (click)="goUp()">Subir</button>
    </div>
  </section>

  <section *ngIf="active && active.type !== 'image'" class="viewer">
    <header class="viewer-header">
      <div class="viewer-name">{{ active.name }}</div>
      <button type="button" class="viewer-close" (click)="clearActive()">×</button>
    </header>

    <ng-container [ngSwitch]="active.type">
      <video *ngSwitchCase="'video'" [src]="activeUrl" controls autoplay></video>
      <audio *ngSwitchCase="'audio'" [src]="activeUrl" controls autoplay></audio>
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
  <div *ngIf="!loading && !hasVisibleContent" class="status">{{ emptyMessage }}</div>

  <section *ngIf="!loading && visibleGalleries.length" class="panel">
    <div class="panel-head">
      <h3>Galerías</h3>
      <span>{{ visibleGalleries.length }}</span>
    </div>

    <div class="gallery-grid">
      <button
        type="button"
        class="gallery-card"
        *ngFor="let entry of visibleGalleries; trackBy: trackByGalleryPath"
        (click)="openGallery(entry.gallery)">
        <div class="gallery-icon" aria-hidden="true">
          <span class="folder-top"></span>
          <span class="folder-body"></span>
        </div>

        <div class="gallery-copy">
          <div class="gallery-name">{{ entry.gallery.name }}</div>
          <div class="gallery-meta">
            {{ entry.subgalleryCount }} subgalerías · {{ entry.mediaCount }} archivos
          </div>
        </div>
      </button>
    </div>
  </section>

  <section *ngIf="!loading && visibleItems.length" class="panel">
    <div class="panel-head">
      <h3>Archivos</h3>
      <span>{{ visibleItems.length }}</span>
    </div>

    <div class="grid">
      <button
        type="button"
        class="card"
        *ngFor="let media of visibleItems; trackBy: trackById"
        [class.card-image]="media.type === 'image'"
        [class.card-active]="active?.id === media.id"
        (click)="select(media)">
        <div class="thumb" *ngIf="media.type === 'image'; else mediaIcon">
          <img [src]="mediaUrl(media)" [alt]="media.name" loading="lazy">
        </div>
        <ng-template #mediaIcon>
          <div class="thumb thumb-fallback" [attr.data-kind]="media.type">
            <span class="kind">{{ media.type === 'video' ? 'Video' : 'Audio' }}</span>
            <span class="glyph" aria-hidden="true">{{ media.type === 'video' ? '▶' : '♫' }}</span>
          </div>
        </ng-template>

        <div class="copy">
          <div class="name" title="{{ media.relativePath }}">{{ media.name }}</div>
          <div class="meta">{{ media.mimeType }} · {{ media.size | number }} bytes</div>
        </div>
      </button>
    </div>
  </section>

  <div class="overlay" *ngIf="active && active.type === 'image'" (click)="clearActive()">
    <div class="overlay-content" (click)="$event.stopPropagation()">
      <button type="button" class="overlay-close" (click)="clearActive()">×</button>
      <img [src]="activeUrl" [alt]="active.name">
      <div class="overlay-caption">
        <h3>{{ active.name }}</h3>
        <div class="overlay-meta">
          {{ active.mimeType }} · {{ active.size | number }} bytes · {{ active.modifiedAt | date:'medium' }}
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .title { margin-bottom: 4px; }
    .subtitle { margin-top: 0; margin-bottom: 16px; color:#555; }
    .browser {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid #dbe4ff;
      background:
        radial-gradient(circle at top left, rgba(46, 70, 211, .12), transparent 45%),
        linear-gradient(180deg, #f8fbff, #f4f7fb);
      display: grid;
      gap: 14px;
    }
    .breadcrumbs {
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:8px;
    }
    .crumb {
      border:none;
      border-radius:999px;
      background:transparent;
      color:#3652cc;
      cursor:pointer;
      font-size:13px;
      padding:4px 10px;
    }
    .crumb.active {
      background:#dfe7ff;
      color:#1f3ba8;
      font-weight:600;
    }
    .crumb-sep {
      color:#94a3b8;
      font-size:12px;
    }
    .browser-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
    }
    .browser-title {
      font-size: 22px;
      font-weight: 700;
      color:#0f172a;
    }
    .browser-meta {
      margin-top: 4px;
      color:#475569;
      font-size:13px;
    }
    .back-button {
      border:none;
      border-radius:999px;
      padding:10px 14px;
      background:#2e46d3;
      color:#fff;
      cursor:pointer;
      font-weight:600;
    }
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
    .viewer audio {
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
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      align-items:center;
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
    .panel {
      margin-top: 18px;
      display:grid;
      gap:12px;
    }
    .panel-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }
    .panel-head h3 {
      margin:0;
      font-size:18px;
    }
    .panel-head span {
      font-size:12px;
      color:#64748b;
      text-transform:uppercase;
      letter-spacing:.08em;
    }
    .gallery-grid,
    .grid {
      display:grid;
      gap:12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 580px) {
      .gallery-grid,
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 960px) {
      .gallery-grid,
      .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .gallery-card {
      border:none;
      border-radius: 16px;
      padding: 18px;
      background:
        linear-gradient(135deg, rgba(46, 70, 211, .09), rgba(14, 165, 233, .04)),
        #ffffff;
      box-shadow: 0 10px 24px rgba(15, 23, 42, .08);
      display:grid;
      gap:16px;
      text-align:left;
      cursor:pointer;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .gallery-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 28px rgba(15, 23, 42, .14);
    }
    .gallery-icon {
      position:relative;
      width:60px;
      height:44px;
    }
    .folder-top,
    .folder-body {
      position:absolute;
      left:0;
      display:block;
      border-radius:10px;
      background: linear-gradient(180deg, #fbbf24, #f59e0b);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
    }
    .folder-top {
      top:0;
      width:26px;
      height:14px;
      border-bottom-left-radius:4px;
      border-bottom-right-radius:4px;
    }
    .folder-body {
      top:10px;
      width:60px;
      height:34px;
    }
    .gallery-copy {
      display:grid;
      gap:4px;
    }
    .gallery-name {
      font-size:16px;
      font-weight:700;
      color:#0f172a;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .gallery-meta {
      color:#475569;
      font-size:13px;
      line-height:1.4;
    }
    .card {
      border-radius: 14px;
      border: 1px solid #e5e7eb;
      background: #fff;
      display:grid;
      cursor:pointer;
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
      text-align:left;
      color:#111827;
      overflow:hidden;
      padding:0;
    }
    .card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,.1);
      border-color:#c7d2fe;
    }
    .card-active {
      border-color:#2e46d3;
      box-shadow: 0 0 0 3px rgba(46, 70, 211, .12);
    }
    .card-image {
      aspect-ratio: 1 / 1;
      align-content: stretch;
    }
    .thumb {
      position:relative;
      min-height: 0;
      background:#f5f7fb;
      overflow:hidden;
    }
    .card-image .thumb {
      aspect-ratio: 1 / 1;
    }
    .thumb img {
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
      transition: transform .2s ease;
    }
    .card:hover .thumb img {
      transform: scale(1.03);
    }
    .thumb-fallback {
      min-height: 132px;
      display:grid;
      place-items:center;
      gap:8px;
      padding:16px;
      color:#fff;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,.18), transparent 48%),
        linear-gradient(135deg, #0f172a, #1d4ed8);
    }
    .thumb-fallback[data-kind='audio'] {
      background:
        radial-gradient(circle at top left, rgba(255,255,255,.18), transparent 48%),
        linear-gradient(135deg, #1f2937, #0f766e);
    }
    .kind {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:5px 10px;
      border-radius:999px;
      background:rgba(255,255,255,.16);
      font-size:12px;
      letter-spacing:.04em;
      text-transform:uppercase;
    }
    .glyph {
      font-size:32px;
      line-height:1;
    }
    .copy {
      display:grid;
      gap:4px;
      padding:10px 12px 12px;
    }
    .name {
      font-weight:600;
      font-size:13px;
      line-height:1.3;
      overflow:hidden;
      display:-webkit-box;
      -webkit-line-clamp:2;
      -webkit-box-orient:vertical;
    }
    .meta {
      color:#6b7280;
      font-size:11px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.78);
      display: grid;
      place-items: center;
      padding: 24px;
      z-index: 100;
    }
    .overlay-content {
      position: relative;
      max-width: min(1080px, 100%);
      max-height: calc(100vh - 80px);
      background: #111827;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 10px 32px rgba(0,0,0,.3);
      display: grid;
      gap: 12px;
      justify-items: center;
    }
    .overlay-content img {
      max-width: 100%;
      max-height: 72vh;
      object-fit: contain;
      border-radius: 12px;
      background:#000;
    }
    .overlay-caption {
      color:#f3f4f6;
      text-align:center;
    }
    .overlay-caption h3 {
      margin:0;
      font-size:18px;
      font-weight:600;
      word-break:break-word;
    }
    .overlay-meta {
      margin-top:4px;
      font-size:13px;
      opacity:.76;
    }
    .overlay-close {
      position:absolute;
      top:12px;
      right:12px;
      border:none;
      width:36px;
      height:36px;
      border-radius:50%;
      background:rgba(0,0,0,.55);
      color:#fff;
      cursor:pointer;
      font-size:22px;
      line-height:1;
    }
    .overlay-close:hover { background:rgba(0,0,0,.78); }
  `]
})
export class ServerMediaComponent implements OnInit {
  rootGallery: ServerMediaGallery | null = null;
  galleryPath: ServerMediaGallery[] = [];
  visibleGalleries: GalleryCard[] = [];
  visibleItems: ServerMediaItem[] = [];
  loading = true;
  filter: FilterOption = 'all';
  active: ServerMediaItem | null = null;
  activeUrl: string | null = null;

  private matchCountByPath = new Map<string, number>();
  private visibleGalleryCountByPath = new Map<string, number>();

  constructor(private api: ApiService, private auth: AuthService) {}

  get currentGallery(): ServerMediaGallery | null {
    return this.galleryPath.length ? this.galleryPath[this.galleryPath.length - 1] : this.rootGallery;
  }

  get currentGalleryName(): string {
    return this.galleryPath.length ? this.galleryPath[this.galleryPath.length - 1].name : 'Inicio';
  }

  get filterLabel(): string {
    switch (this.filter) {
      case 'video':
        return 'Videos';
      case 'image':
        return 'Imágenes';
      case 'audio':
        return 'Audio';
      default:
        return 'Todo';
    }
  }

  get hasVisibleContent(): boolean {
    return this.visibleGalleries.length > 0 || this.visibleItems.length > 0;
  }

  get emptyMessage(): string {
    if (this.filter !== 'all') {
      return 'No hay resultados para el filtro seleccionado en esta galería.';
    }

    if (this.galleryPath.length) {
      return 'Esta galería no contiene archivos multimedia compatibles.';
    }

    return 'No se encontraron carpetas o archivos compatibles.';
  }

  ngOnInit(): void {
    this.api.listServerMedia().subscribe({
      next: (gallery) => {
        this.rootGallery = gallery;
        this.galleryPath = [];
        this.rebuildView();
        this.loading = false;
      },
      error: (err) => {
        console.error('No se pudo obtener la biblioteca del servidor', err);
        this.rootGallery = null;
        this.galleryPath = [];
        this.visibleGalleries = [];
        this.visibleItems = [];
        this.loading = false;
      }
    });
  }

  setFilter(filter: FilterOption) {
    if (this.filter === filter) return;
    this.filter = filter;
    this.clearActive();
    this.rebuildView();
  }

  openGallery(gallery: ServerMediaGallery) {
    this.galleryPath = [...this.galleryPath, gallery];
    this.clearActive();
    this.refreshCurrentGallery();
  }

  goToRoot() {
    if (!this.galleryPath.length) return;
    this.galleryPath = [];
    this.clearActive();
    this.refreshCurrentGallery();
  }

  goToGallery(index: number) {
    this.galleryPath = this.galleryPath.slice(0, index + 1);
    this.clearActive();
    this.refreshCurrentGallery();
  }

  goUp() {
    if (!this.galleryPath.length) return;
    this.galleryPath = this.galleryPath.slice(0, -1);
    this.clearActive();
    this.refreshCurrentGallery();
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

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.active) this.clearActive();
  }

  streamUrl(item: ServerMediaItem) {
    const base = this.api.serverMediaStreamUrl(item.id);
    const token = this.auth.token;
    if (!token) return base;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }

  mediaUrl(item: ServerMediaItem) {
    return this.streamUrl(item);
  }

  trackById(_index: number, item: ServerMediaItem) {
    return item.id;
  }

  trackByGalleryPath(_index: number, entry: GalleryCard) {
    return entry.gallery.relativePath;
  }

  private rebuildView() {
    this.matchCountByPath.clear();
    this.visibleGalleryCountByPath.clear();

    if (this.rootGallery) {
      this.computeMatchState(this.rootGallery);
    }

    this.refreshCurrentGallery();
  }

  private refreshCurrentGallery() {
    const gallery = this.currentGallery;
    if (!gallery) {
      this.visibleGalleries = [];
      this.visibleItems = [];
      return;
    }

    this.visibleGalleries = gallery.galleries
      .filter(child => this.getMatchCount(child) > 0)
      .map(child => ({
        gallery: child,
        mediaCount: this.getMatchCount(child),
        subgalleryCount: this.getVisibleSubgalleryCount(child)
      }));

    this.visibleItems = gallery.items.filter(item => this.matchesFilter(item));
  }

  private computeMatchState(gallery: ServerMediaGallery): number {
    const childCounts = gallery.galleries.map(child => this.computeMatchState(child));
    const ownMatches = gallery.items.filter(item => this.matchesFilter(item)).length;
    const descendantMatches = childCounts.reduce((total, count) => total + count, 0);
    const totalMatches = ownMatches + descendantMatches;
    const visibleSubgalleries = childCounts.filter(count => count > 0).length;

    this.matchCountByPath.set(gallery.relativePath, totalMatches);
    this.visibleGalleryCountByPath.set(gallery.relativePath, visibleSubgalleries);

    return totalMatches;
  }

  private getMatchCount(gallery: ServerMediaGallery) {
    return this.matchCountByPath.get(gallery.relativePath) ?? 0;
  }

  private getVisibleSubgalleryCount(gallery: ServerMediaGallery) {
    return this.visibleGalleryCountByPath.get(gallery.relativePath) ?? 0;
  }

  private matchesFilter(item: ServerMediaItem) {
    return this.filter === 'all' || item.type === this.filter;
  }
}
