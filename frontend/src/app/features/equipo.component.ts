import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SupabaseService } from '../core/services/supabase.service';
import { Staff } from '../core/models/staff';
import { FooterPublicoComponent } from '../shared/footer-publico.component';
import { HeaderPublicoComponent } from '../shared/header-publico.component';

@Component({
  selector: 'app-equipo',
  imports: [RouterLink, FooterPublicoComponent, HeaderPublicoComponent],
  template: `
    <main class="min-h-screen bg-app-negro">
      <app-header-publico active="barberos"></app-header-publico>

      <section class="max-w-6xl mx-auto px-6 py-16">
        <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase text-center mb-3">Detrás de la Silla</p>
        <h1 class="font-hero text-5xl lg:text-7xl text-app-blanco text-center uppercase mb-4">Nuestros Barberos</h1>
        <p class="text-app-blanco/70 text-center mb-12 max-w-2xl mx-auto">
          Maestros del oficio con años en las navajas. Elige tu barbero al reservar
          — cada uno tiene su sello, todos comparten el estándar de la casa.
        </p>

        @if (cargando()) {
          <p class="text-center text-app-blanco/50">Cargando equipo...</p>
        } @else if (equipo().length === 0) {
          <p class="text-center text-app-blanco/50">Pronto presentaremos a nuestro equipo.</p>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (m of equipo(); track m.id) {
              <article class="card">
                <img [src]="m.foto_url" [alt]="m.nombre" class="card-img" />
                <div class="card-body">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-xl font-black text-app-blanco leading-tight">
                        {{ m.nombre }} {{ m.apellido }}
                      </p>
                      <p class="text-sm text-app-oro font-bold mt-1 uppercase tracking-wider">{{ m.especialidad }}</p>
                    </div>
                    @if (m.rating_promedio) {
                      <span class="rating">
                        ★ {{ m.rating_promedio.toFixed(1) }}
                        <span class="text-app-blanco/50 font-normal">({{ m.total_resenas }})</span>
                      </span>
                    }
                  </div>
                  @if (m.bio) {
                    <p class="text-sm text-app-blanco/70 mt-3 leading-relaxed">{{ m.bio }}</p>
                  }
                  <div class="card-footer">
                    @if (m.instagram) {
                      <a [href]="'https://instagram.com/' + m.instagram.replace('@','')"
                         target="_blank" rel="noopener" class="link-ig">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="2" width="20" height="20" rx="5"/>
                          <circle cx="12" cy="12" r="4"/>
                          <circle cx="18" cy="6" r="1" fill="currentColor"/>
                        </svg>
                        {{ m.instagram }}
                      </a>
                    }
                    <a routerLink="/cita" class="link-book">Reservar con {{ m.nombre }} →</a>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <app-footer-publico></app-footer-publico>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";

    .card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             transition-all hover:border-app-azul/40;
    }
    .card-img {
      @apply w-full h-64 object-cover bg-white/10 grayscale hover:grayscale-0 transition-all duration-500;
    }
    .card-body { @apply p-5; }
    .card-footer {
      @apply mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2;
    }
    .rating {
      @apply text-sm text-amber-400 font-bold inline-flex items-center gap-1;
    }
    .link-ig {
      @apply inline-flex items-center gap-1.5 text-xs text-app-blanco/70 hover:text-app-azul;
    }
    .link-ig svg { @apply w-4 h-4; }
    .link-book {
      @apply text-xs font-bold uppercase tracking-wide text-app-azul hover:underline;
    }
  `],
})
export class EquipoComponent {
  private auth = inject(AuthService);
  private supa = inject(SupabaseService);

  equipo = signal<Staff[]>([]);
  cargando = signal(true);
  isLoggedIn = () => this.auth.isAuthenticated();

  constructor() { this.cargar(); }

  private async cargar() {
    // Lectura pública vía Supabase + agregar stats de reseñas
    const { data: staff } = await this.supa.client
      .from('appsalon_staff')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    const { data: resenas } = await this.supa.client
      .from('appsalon_resenas')
      .select('staff_id, rating');

    const stats = new Map<string, { sum: number; n: number }>();
    for (const r of (resenas as { staff_id: string; rating: number }[]) || []) {
      if (!r.staff_id) continue;
      const cur = stats.get(r.staff_id) ?? { sum: 0, n: 0 };
      cur.sum += r.rating; cur.n += 1;
      stats.set(r.staff_id, cur);
    }

    this.equipo.set(((staff as Staff[]) || []).map(s => {
      const st = stats.get(s.id);
      return {
        ...s,
        rating_promedio: st ? st.sum / st.n : null,
        total_resenas: st?.n ?? 0,
      };
    }));
    this.cargando.set(false);
  }
}
