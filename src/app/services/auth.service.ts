import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, Usuario } from '../models/api.models';

interface LoginWith2FAResponse {
  requires_2fa: boolean;
  message: string;
  email: string;
}

interface Verify2FARequest {
  email: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private tokenKey = 'auth_token';

  // Signal para el usuario autenticado
  currentUser = signal<Usuario | null>(null);
  isAuthenticated = signal(false);

  // Signals para 2FA
  requires2FA = signal(false);
  userEmail = signal<string>('');

  constructor(private http: HttpClient) {
    // Verificar si hay un token guardado al iniciar
    this.checkAuthStatus();
  }

  /**
   * Verificar si hay una sesión activa
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      // Obtener información del usuario
      this.me().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        },
        error: (err) => {
          // Si el token es inválido o expiró, limpiar sesión silenciosamente
          console.warn('Token inválido o expirado, limpiando sesión:', err);
          this.clearSession();
        }
      });
    }
  }

  /**
   * Login - Puede retornar token directamente o requerir 2FA
   */
  login(credentials: LoginRequest): Observable<LoginResponse | LoginWith2FAResponse> {
    return this.http.post<LoginResponse | LoginWith2FAResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Verificar si requiere 2FA
        if ('requires_2fa' in response && response.requires_2fa) {
          this.requires2FA.set(true);
          this.userEmail.set(response.email);
        } else if ('token' in response) {
          // Login directo sin 2FA - Verificar que sea administrador
          if (response.user.role_id !== 1) {
            throw new Error('Acceso denegado. Solo los administradores pueden acceder a este panel.');
          }
          this.setToken(response.token);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.requires2FA.set(false);
        }
      })
    );
  }

  /**
   * Verificar código 2FA
   */
  verify2FA(request: Verify2FARequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/verify-2fa`, request).pipe(
      tap(response => {
        // Verificar que sea administrador
        if (response.user.role_id !== 1) {
          throw new Error('Acceso denegado. Solo los administradores pueden acceder a este panel.');
        }
        this.setToken(response.token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.requires2FA.set(false);
        this.userEmail.set('');
      })
    );
  }

  /**
   * Reenviar código 2FA
   */
  resend2FA(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/login/resend-2fa`, { email });
  }

  /**
   * Obtener información del usuario autenticado
   */
  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  /**
   * Limpiar sesión local
   */
  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.requires2FA.set(false);
    this.userEmail.set('');
  }

  /**
   * Guardar token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleId: number): boolean {
    const user = this.currentUser();
    return user?.role_id === roleId;
  }

  /**
   * Verificar si es administrador
   */
  isAdmin(): boolean {
    return this.hasRole(1);
  }

  /**
   * Verificar si es agente
   */
  isAgente(): boolean {
    return this.hasRole(2);
  }
}
