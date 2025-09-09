import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-video-detail',
  imports: [CommonModule, FormsModule],
  template: `
  <div *ngIf="video">
  <h2>{{ video.title }}</h2>

  <!-- GIF como imagen -->
  <img *ngIf="isGif" [src]="src" style="max-width:100%;height:auto" />

  <!-- Video MP4/WebM: solo cuando src ya está listo -->
  <ng-container *ngIf="!isGif">
    <ng-container *ngIf="src; else loadingTpl">
      <video [src]="src" width="100%" height="auto" controls (play)="onPlay()"></video>
    </ng-container>
    <ng-template #loadingTpl>
      <div style="opacity:.7">Cargando video…</div>
    </ng-template>
  </ng-container>

  <p style="margin:8px 0 16px">{{ video.description }}</p>

  <h3>Comentarios</h3>
  <form (ngSubmit)="addComment()">
    <input [(ngModel)]="comment" name="comment" placeholder="Escribe un comentario..." required>
    <button>Enviar</button>
  </form>

  <ul>
    <li *ngFor="let c of comments">
      {{ c.username }}: {{ c.content }}
      <small>({{ c.createdAt | date:'short' }})</small>
    </li>
  </ul>
</div>
  `
})
export class VideoDetailComponent implements OnInit {
  id = 0;
  video: any = null;
  src = '';           // blob URL
  isGif = false;
  comments: any[] = [];
  comment = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getVideo(this.id).subscribe({
      next: v => {
        this.video = v;
        this.isGif = (v?.mimeType || '').toLowerCase() === 'image/gif';
        this.loadBlob();        // <- obtenemos el blob protegido con JWT
        this.loadComments();
      },
      error: e => {
        // Si hay 401, redirige a /login o muestra un mensaje
        console.error('Error cargando video', e);
      }
    });
  }

  // 👉 aquí está
  ngOnDestroy(): void {
    if (this.src) {
      URL.revokeObjectURL(this.src);
    }
  }

  loadBlob(): void {
    this.api.getStreamBlob(this.id).subscribe({
      next: blob => {
        // Limpia URL anterior para evitar fugas de memoria
        if (this.src) URL.revokeObjectURL(this.src);
        this.src = URL.createObjectURL(blob);
      },
      error: e => console.error('No se pudo cargar el stream', e)
    });
  }

  onPlay(): void {
    this.api.incView(this.id).subscribe();
  }

  loadComments(): void {
    this.api.listComments(this.id).subscribe(c => (this.comments = c));
  }

  addComment(): void {
    if (!this.comment.trim()) return;
    this.api.addComment(this.id, this.comment).subscribe(() => {
      this.comment = '';
      this.loadComments();
    });
  }
}
