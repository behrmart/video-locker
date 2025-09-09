// src/pages/gallery/gallery.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Video } from '../../services/api.service';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule, RouterLink],
  template: `
  <h2 style="margin:8px 0 16px">Galería</h2>
  <div class="grid">
    <a *ngFor="let v of videos" [routerLink]="['/video', v.id]" class="card">
      <div class="thumb">🎬</div>
      <div class="meta">
        <div class="title">{{ v.title }}</div>
        <div class="sub">{{ v.views }} vistas • {{ v.createdAt | date:'short' }}</div>
      </div>
    </a>
  </div>
  `,
  styles:[`
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
    .card{display:block;padding:12px;border:1px solid #eee;border-radius:12px;text-decoration:none;color:inherit}
    .thumb{font-size:48px;text-align:center;margin:10px 0}
    .title{font-weight:600}.sub{opacity:.7}
  `]
})
export class GalleryComponent implements OnInit {
  videos: Video[] = [];
  constructor(private api: ApiService) {}
  ngOnInit(): void {
    this.api.listVideos().subscribe((v: Video[]) => this.videos = v);
  }
}
