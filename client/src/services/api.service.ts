// src/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Video {
  id: number;
  title: string;
  views: number;
  description?: string;
  mimeType: string;
  createdAt: string;
}

export interface Photo {
  id: number;
  title: string;
  filename: string;
  mimeType: string;
  createdAt: string;
}


@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // catálogo
  listVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${environment.apiUrl}/videos`);
  }

  listPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${environment.apiUrl}/photos`);
  }

  getVideo(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/videos/${id}`);
  }

  incView(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/videos/${id}/view`, {});
  }

  // comentarios
  listComments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/videos/${id}/comments`);
  }

  addComment(id: number, content: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/videos/${id}/comments`, { content });
  }

  // admin (simple)
  uploadVideo(fd: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/admin/videos`, fd);
  }

  uploadPhoto(fd: FormData) {
    return this.http.post(`${environment.apiUrl}/admin/photos`, fd);
  }

  // 🔒 stream protegido → devolvemos Blob para <video>/<img> vía blob URL
  getStreamBlob(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/videos/${id}/stream`, { responseType: 'blob' });
  }

  getPhotoBlob(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/photos/${id}/stream`, { responseType: 'blob' });
  }

  // 🔥 nuevo: borrar por id (admin)
  deleteVideo(id: number) {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/admin/videos/${id}`);
  }

  deletePhoto(id: number) {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/admin/photos/${id}`);
  }
}
