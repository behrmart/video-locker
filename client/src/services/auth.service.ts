// client/src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

interface LoginResp { token: string; user: { id:number; username:string; role:'USER'|'ADMIN' } }
interface JwtPayload { exp?: number; iat?: number; [k: string]: any; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private key = 'vl_token';
  private logoutTimer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient) {
    // al recargar la app, si hay token en sessionStorage, re-programa autologout
    const t = this.token;
    if (t) this.scheduleAutoLogout();
  }

  // ==== storage (sesión por pestaña) ====
  get token(): string | null { return sessionStorage.getItem(this.key); }
  set token(v: string | null) {
    if (v) sessionStorage.setItem(this.key, v);
    else sessionStorage.removeItem(this.key);
  }

  // ==== API auth ====
  login(username: string, password: string) {
    return this.http.post<LoginResp>(`${environment.apiUrl}/auth/login`, { username, password });
  }
  register(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password });
  }

  // ==== helpers de JWT ====
  private decodePayload(token: string | null): JwtPayload | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      // atob payload (base64url → base64)
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(b64);
      return JSON.parse(json);
    } catch { return null; }
  }

  get payload(): JwtPayload | null {
    return this.decodePayload(this.token);
  }

  get expMillis(): number | null {
    const p = this.payload;
    return (p?.exp ? p.exp * 1000 : null);
  }

  isExpired(skewMs = 5000): boolean {
    const exp = this.expMillis;
    if (!exp) return false; // si el token no trae exp, lo consideramos no vencido (o podrías forzar logout)
    return Date.now() + skewMs >= exp;
  }

  // ==== sesión ====
  isLoggedIn(): boolean {
    const t = this.token;
    if (!t) return false;
    if (this.isExpired()) { this.logout(); return false; }
    return true;
  }

  finalizeLogin(token: string) {
    this.token = token;
    this.clearTimer();
    this.scheduleAutoLogout();
  }

  logout() {
    this.clearTimer();
    this.token = null;
  }

  private scheduleAutoLogout() {
    const exp = this.expMillis;
    if (!exp) return;
    const ms = Math.max(0, exp - Date.now());
    this.logoutTimer = setTimeout(() => {
      this.logout();
      // el interceptor se encargará de redirigir o puedes emitir un Subject si lo prefieres
    }, ms);
  }

  private clearTimer() {
    if (this.logoutTimer) { clearTimeout(this.logoutTimer); this.logoutTimer = undefined; }
  }
}
