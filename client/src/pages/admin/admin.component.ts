import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
/* Material */
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpEventType } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
  <mat-card appearance="outlined">
    <mat-card-header><mat-card-title>Administrar videos</mat-card-title></mat-card-header>
    <mat-card-content>
      <form (ngSubmit)="upload()" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Título</mat-label>
          <input matInput [(ngModel)]="title" name="title" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Descripción</mat-label>
          <input matInput [(ngModel)]="description" name="description">
        </mat-form-field>

        <input type="file" (change)="onFile($event)" required>
        <button mat-raised-button color="primary">Subir</button>
      </form>

      <mat-progress-bar *ngIf="progress>0 && progress<100" mode="determinate" [value]="progress" style="margin-top:12px"></mat-progress-bar>
      <p *ngIf="msg" style="margin-top:8px">{{msg}}</p>
    </mat-card-content>
  </mat-card>
  `,
  styles:[`.form{display:grid;gap:12px;max-width:520px}.full{width:100%}`]
})
export class AdminComponent {
  title=''; description=''; file?:File; msg=''; progress=0;
  constructor(private api: ApiService, private sb: MatSnackBar) {}
  onFile(e:Event){ const input = e.target as HTMLInputElement; this.file = input.files?.[0] || undefined; }
  upload(){
    if(!this.file){ this.sb.open('Selecciona un archivo', 'OK', {duration:2000}); return; }
    const fd = new FormData();
    fd.append('title', this.title);
    fd.append('description', this.description);
    fd.append('file', this.file);
    this.progress = 0; this.msg = '';
    this.api.uploadVideoWithProgress(fd).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) {
          this.progress = Math.round(100 * ev.loaded / ev.total);
        } else if (ev.type === HttpEventType.Response) {
          this.progress = 100; this.msg = 'Subido ✅'; this.sb.open('Subido ✅', 'OK', {duration:2000});
        }
      },
      error: e => { this.msg = e?.error?.error || 'Error'; this.sb.open(this.msg, 'OK', {duration:2500}); this.progress=0; }
    });
  }
}

