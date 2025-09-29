// src/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
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


@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // catálogo
  listVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${environment.apiUrl}/videos`);
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

  // admin (con progreso) – si lo usas
  uploadVideoWithProgress(fd: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${environment.apiUrl}/admin/videos`, fd, { reportProgress: true });
    return this.http.request(req);
  }

  // 🔒 stream protegido → devolvemos Blob para <video>/<img> vía blob URL
  getStreamBlob(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/videos/${id}/stream`, { responseType: 'blob' });
  }

   // 🔥 nuevo: borrar por id (admin)
  deleteVideo(id: number) {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/admin/videos/${id}`);
  }
}
