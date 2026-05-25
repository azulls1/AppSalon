import { Injectable, signal } from '@angular/core';
import { SupabaseClient, createClient, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';


/** Resuelve el URL de Supabase a un absoluto. Si environment.supabaseUrl
 *  empieza con `/`, asumimos un proxy local (nginx) y prepende el origin
 *  actual — supabase-js rechaza paths relativos.
 */
function resolveSupabaseUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return window.location.origin + raw;
  return raw;
}


@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly session = signal<Session | null>(null);

  /** Resuelve cuando la sesión inicial se ha leído de storage. Útil para
   *  los guards: evita race conditions al refrescar rutas privadas. */
  readonly ready: Promise<void>;

  constructor() {
    this.client = createClient(
      resolveSupabaseUrl(environment.supabaseUrl),
      environment.supabaseAnonKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    );

    this.ready = this.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });

    this.client.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }
}
