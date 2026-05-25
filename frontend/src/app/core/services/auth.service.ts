import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

export interface SignUpData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supa = inject(SupabaseService);
  private router = inject(Router);

  readonly session = this.supa.session;

  /** true sólo si hay sesión Y el token no ha expirado.
   *  Evita falsos positivos cuando Supabase hidrata desde localStorage
   *  un token caducado. */
  readonly isAuthenticated = computed(() => {
    const s = this.session();
    if (!s) return false;
    if (s.expires_at && s.expires_at * 1000 <= Date.now()) return false;
    return true;
  });

  readonly user = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.access_token ?? null);

  /** Resuelve cuando la sesión inicial ya se intentó leer de storage.
   *  Los guards deben await esto antes de decidir. */
  ready(): Promise<void> {
    return this.supa.ready;
  }

  /** Redirige a /login si no está autenticado, preservando el destino
   *  como returnUrl para volver tras el login. */
  requireAuthOrLogin(returnUrl: string): boolean {
    if (this.isAuthenticated()) return true;
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
    return false;
  }

  async signUp(data: SignUpData) {
    const { error } = await this.supa.client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { nombre: data.nombre, apellido: data.apellido, telefono: data.telefono ?? '' },
      },
    });
    if (error) throw error;
  }

  async signIn(email: string, password: string) {
    const { error } = await this.supa.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut() {
    await this.supa.client.auth.signOut();
    // Defensivo: aunque onAuthStateChange suele hacerlo, forzamos el signal a null
    this.supa.session.set(null);
  }

  async resetPassword(email: string) {
    const { error } = await this.supa.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/recuperar',
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supa.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }
}
