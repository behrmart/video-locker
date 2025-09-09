// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';


bootstrapApplication(AppComponent, {
providers: [
provideRouter(routes),
provideAnimations(),
provideHttpClient(withInterceptors([tokenInterceptor]))
]
});
