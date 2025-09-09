import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

interface LoginResp { token: string; user: { id:number; username:string; role:'USER'|'ADMIN' } }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private key = 'vl_token';
  constructor(private http: HttpClient) {}

  get token(): string | null { return sessionStorage.getItem(this.key); }
  set token(v: string | null) { v ? sessionStorage.setItem(this.key, v) : sessionStorage.removeItem(this.key); }

  login(username: string, password: string) {
    return this.http.post<LoginResp>(`${environment.apiUrl}/auth/login`, { username, password });
  }
  register(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password });
  }
  logout(){ this.token = null; }
  isLoggedIn(){ return !!this.token; }
}
