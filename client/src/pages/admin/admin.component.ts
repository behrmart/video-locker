import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Video, Photo } from '../../services/api.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule],
  template: `
  <h2>Panel de Administración</h2>

  <div class="note" *ngIf="!isAdmin">
    Debes ser <b>ADMIN</b> para usar esta página. Redirigiendo…
  </div>

  <section class="card">
    <h3>Subir video / GIF</h3>
    <form (submit)="onUpload($event)">
      <input type="text" name="title" placeholder="Título" required>
      <textarea name="description" placeholder="Descripción (opcional)"></textarea>
      <input type="file" name="file" accept="video/*,image/gif" required>
      <button>Subir</button>
    </form>
    <div *ngIf="uploadMsg" class="msg">{{ uploadMsg }}</div>
  </section>

  <section class="card">
    <h3>Subir foto</h3>
    <form (submit)="onPhotoUpload($event)">
      <input type="text" name="title" placeholder="Título" required>
      <input type="file" name="file" accept="image/*" required>
      <button>Subir foto</button>
    </form>
    <div *ngIf="photoUploadMsg" class="msg">{{ photoUploadMsg }}</div>
  </section>

  <!-- Lista -->
  <section class="card">
    <h3>Videos / GIFs ({{videos.length}})</h3>

    <div class="table">
      <div class="thead">
        <div>Título</div>
        <div>Tipo</div>
        <div>Vistas</div>
        <div>Fecha</div>
        <div></div>
      </div>

      <div class="row" *ngFor="let v of videos; trackBy: trackById">
        <div class="title" [title]="v.title">{{ v.title }}</div>
        <div>{{ v.mimeType }}</div>
        <div>{{ v.views }}</div>
        <div>{{ v.createdAt | date:'yyyy-MM-dd HH:mm' }}</div>
        <div class="actions">
          <button class="danger" (click)="onDelete(v)">Borrar</button>
        </div>
      </div>
    </div>

    <div *ngIf="listMsg" class="msg">{{ listMsg }}</div>
  </section>

  <section class="card">
    <h3>Fotos ({{photos.length}})</h3>

    <div class="photos-grid" *ngIf="photos.length; else emptyPhotos">
      <div class="photo-item" *ngFor="let p of photos; trackBy: trackByPhotoId">
        <div class="title" [title]="p.title">{{ p.title }}</div>
        <div class="meta">{{ p.mimeType }} · {{ p.createdAt | date:'yyyy-MM-dd HH:mm' }}</div>
        <div class="actions">
          <button class="danger" (click)="onDeletePhoto(p)">Borrar</button>
        </div>
      </div>
    </div>
    <ng-template #emptyPhotos>
      <div class="msg muted">No hay fotos cargadas.</div>
    </ng-template>

    <div *ngIf="photoListMsg" class="msg">{{ photoListMsg }}</div>
  </section>
  `,
  styles: [`
    h2{margin-bottom:12px}
    .card{background:#fff;border-radius:12px;padding:14px;margin:12px 0;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    form{display:grid;gap:10px}
    input[type="text"], textarea, input[type="file"] {padding:8px;border:1px solid #ddd;border-radius:10px}
    button{padding:8px 12px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer}
    button:hover{background:#f7f7f7}
    .danger{border-color:#e28686;color:#b40000}
    .danger:hover{background:#ffe9e9}
    .table{display:grid}
    .thead,.row{display:grid;grid-template-columns: 1.5fr 0.9fr 0.6fr 1fr 0.6fr;gap:8px;align-items:center}
    .thead{font-weight:600;color:#555;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px}
    .row{padding:6px 0;border-bottom:1px dashed #eee}
    .title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .actions{display:flex;justify-content:flex-end}
    .msg{margin-top:8px;color:#555}
    .msg.muted{color:#888}
    .note{margin:8px 0;color:#a00}
    .photos-grid{display:grid;gap:10px}
    @media(min-width:600px){.photos-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
    .photo-item{display:grid;gap:4px;padding:10px;border:1px solid #ececec;border-radius:10px;background:#fafafa}
    .photo-item .title{font-weight:600}
    .photo-item .meta{font-size:12px;color:#666}
  `]
})
export class AdminComponent implements OnInit {
  videos: Video[] = [];
  photos: Photo[] = [];
  uploadMsg = '';
  photoUploadMsg = '';
  listMsg = '';
  photoListMsg = '';
  isAdmin = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.isAdmin = this.computeIsAdmin();

  if (!this.isAdmin) {
    this.listMsg = 'Debes ser ADMIN para usar esta página. Redirigiendo…';
    setTimeout(() => this.router.navigateByUrl('/'), 1000);
    return;
  }
  this.load();
}

private computeIsAdmin(): boolean {
  const user = this.auth.user;
  if (user && user.role === 'ADMIN') return true;

  const payload = this.auth.payload;
  if (payload && String(payload['role']).toUpperCase() === 'ADMIN') return true;

  return false;
}



  load() {
    this.fetchVideos();
    this.fetchPhotos();
  }

  onUpload(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = (fd.get('title') || '').toString().trim();
    const file = fd.get('file') as File | null;
    if (!title || !file) { this.uploadMsg = 'Falta título o archivo.'; return; }
    this.uploadMsg = 'Subiendo…';
    this.api.uploadVideo(fd).subscribe({
      next: () => { this.uploadMsg = 'Subido ✅'; form.reset(); this.fetchVideos(); },
      error: e => { console.error(e); this.uploadMsg = 'Error al subir.'; }
    });
  }

  onDelete(v: Video) {
    if (!confirm(`¿Borrar "${v.title}"? Esta acción es permanente.`)) return;
    this.api.deleteVideo(v.id).subscribe({
      next: () => {
        this.videos = this.videos.filter(x => x.id !== v.id);
        this.listMsg = `Se borró "${v.title}" ✅`;
      },
      error: e => {
        console.error(e);
        this.listMsg = 'No se pudo borrar (revisa permisos/servidor).';
      }
    });
  }

  trackById(_i: number, v: Video) { return v.id; }

  onPhotoUpload(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = (fd.get('title') || '').toString().trim();
    const file = fd.get('file') as File | null;
    if (!title || !file) { this.photoUploadMsg = 'Falta título o archivo.'; return; }
    this.photoUploadMsg = 'Subiendo…';
    this.api.uploadPhoto(fd).subscribe({
      next: () => { this.photoUploadMsg = 'Foto subida ✅'; form.reset(); this.fetchPhotos(); },
      error: e => { console.error(e); this.photoUploadMsg = 'Error al subir la foto.'; }
    });
  }

  onDeletePhoto(p: Photo) {
    if (!confirm(`¿Borrar "${p.title}"? Esta acción es permanente.`)) return;
    this.api.deletePhoto(p.id).subscribe({
      next: () => {
        this.photos = this.photos.filter(x => x.id !== p.id);
        this.photoListMsg = `Se borró "${p.title}" ✅`;
      },
      error: e => {
        console.error(e);
        this.photoListMsg = 'No se pudo borrar la foto.';
      }
    });
  }

  trackByPhotoId(_i: number, p: Photo) { return p.id; }

  private fetchVideos() {
    this.listMsg = 'Cargando…';
    this.api.listVideos().subscribe({
      next: vs => { this.videos = vs; this.listMsg = ''; },
      error: e => { console.error(e); this.listMsg = 'No se pudo cargar la lista.'; }
    });
  }

  private fetchPhotos() {
    this.photoListMsg = 'Cargando…';
    this.api.listPhotos().subscribe({
      next: ps => { this.photos = ps; this.photoListMsg = ''; },
      error: e => { console.error(e); this.photoListMsg = 'No se pudo cargar la lista de fotos.'; }
    });
  }
}
