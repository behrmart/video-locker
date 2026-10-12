// src/main.ts
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';


registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
providers: [
{ provide: LOCALE_ID, useValue: 'de-DE' },
provideRouter(routes),
provideAnimations(),
provideHttpClient(withInterceptors([tokenInterceptor]))
]
});
