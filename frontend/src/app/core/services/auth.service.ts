import { Injectable, computed, inject } from '@angular/core';
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

  readonly session = this.supa.session;
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.access_token ?? null);

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
