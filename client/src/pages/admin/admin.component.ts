import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Video } from '../../services/api.service';
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

  <!-- Subida (si ya la tienes puedes conservar tu form) -->
  <section class="card">
    <h3>Subir nuevo</h3>
    <form (submit)="onUpload($event)">
      <input type="text" name="title" placeholder="Título" required>
      <textarea name="description" placeholder="Descripción (opcional)"></textarea>
      <input type="file" name="file" accept="video/*,image/gif" required>
      <button>Subir</button>
    </form>
    <div *ngIf="uploadMsg" class="msg">{{ uploadMsg }}</div>
  </section>

  <!-- Lista -->
  <section class="card">
    <h3>Contenido ({{videos.length}})</h3>

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
    .note{margin:8px 0;color:#a00}
  `]
})
export class AdminComponent implements OnInit {
  videos: Video[] = [];
  uploadMsg = '';
  listMsg = '';
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
  // 1) Intentar por 'user' en localStorage
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && String(u.role).toUpperCase() === 'ADMIN') return true;
    }
  } catch {}

  // 2) Fallback: decodificar JWT y leer role
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (payload && String(payload.role).toUpperCase() === 'ADMIN') return true;
    } catch {}
  }

  return false;
}



  load() {
    this.listMsg = 'Cargando…';
    this.api.listVideos().subscribe({
      next: vs => { this.videos = vs; this.listMsg = ''; },
      error: e => { console.error(e); this.listMsg = 'No se pudo cargar la lista.'; }
    });
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
      next: () => { this.uploadMsg = 'Subido ✅'; form.reset(); this.load(); },
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
}
