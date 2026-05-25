import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SupabaseService } from '../core/services/supabase.service';
import { Galeria } from '../core/models/galeria';
import { FooterPublicoComponent } from '../shared/footer-publico.component';

@Component({
  selector: 'app-galeria',
  imports: [RouterLink, FooterPublicoComponent],
  template: `
    <main class="min-h-screen bg-app-negro">
      <header class="border-b border-white/10 bg-app-negro/90 backdrop-blur sticky top-0 z-20">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-3">
            <img src="/images/logo.jpg" alt="Mike's Club Barber Shop" class="brand-logo" />
            <span class="text-2xl font-black text-app-azul">App</span><span class="text-2xl font-black text-app-blanco">Salon</span>
          </a>
          <nav class="flex items-center gap-2">
            <a routerLink="/"          class="nav-link">Inicio</a>
            <a routerLink="/equipo"    class="nav-link">Barberos</a>
            <a routerLink="/galeria"   class="nav-link-active">Galería</a>
            <a routerLink="/ubicacion" class="nav-link">La Casa</a>
            @if (isLoggedIn()) {
              <a routerLink="/cita" class="btn-primary">Reservar</a>
            } @else {
              <a routerLink="/login" class="btn-ghost">Iniciar Sesión</a>
            }
          </nav>
        </div>
      </header>

      <section class="max-w-6xl mx-auto px-6 py-16">
        <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Galería</h1>
        <p class="text-app-blanco/70 text-center mb-12 max-w-2xl mx-auto">
          Transformaciones reales de nuestros clientes. Deslízate para ver el antes y el después.
        </p>

        @if (cargando()) {
          <p class="text-center text-app-blanco/50">Cargando galería...</p>
        } @else if (items().length === 0) {
          <p class="text-center text-app-blanco/50">Pronto subiremos nuestras transformaciones.</p>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (g of items(); track g.id) {
              <article class="card">
                <div class="duo">
                  <div class="duo-side">
                    <img [src]="g.foto_antes_url" [alt]="'Antes ' + g.titulo" />
                    <span class="duo-label">Antes</span>
                  </div>
                  <div class="duo-side">
                    <img [src]="g.foto_despues_url" [alt]="'Después ' + g.titulo" />
                    <span class="duo-label duo-label-after">Después</span>
                  </div>
                </div>
                <div class="p-5">
                  <p class="font-bold text-app-blanco text-lg">{{ g.titulo }}</p>
                  @if (g.descripcion) {
                    <p class="text-sm text-app-blanco/70 mt-1">{{ g.descripcion }}</p>
                  }
                </div>
              </article>
            }
          </div>
        }

        <div class="text-center mt-16">
          @if (isLoggedIn()) {
            <a routerLink="/cita" class="btn-primary text-base px-8 py-4">Quiero mi transformación</a>
          } @else {
            <a routerLink="/crear-cuenta" class="btn-primary text-base px-8 py-4">Quiero mi transformación</a>
          }
        </div>
      </section>

      <app-footer-publico></app-footer-publico>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";
    .btn-primary {
      @apply rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-5 py-2.5
             text-sm font-bold uppercase tracking-wide transition-colors inline-block;
    }
    .btn-ghost {
      @apply rounded-md border border-white/25 hover:bg-white/10 text-app-blanco px-5 py-2.5
             text-sm font-bold uppercase tracking-wide transition-colors;
    }
    .nav-link, .nav-link-active {
      @apply text-sm font-bold uppercase tracking-wide
             hover:text-app-blanco transition-colors px-3 py-2;
    }
    .nav-link { @apply text-app-blanco/60; }
    .nav-link-active { @apply text-app-blanco; }

    .brand-logo {
      @apply h-14 w-auto object-contain shrink-0;
      mix-blend-mode: screen;
    }

    .card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             hover:border-app-azul/40 transition-all;
    }
    .duo { @apply grid grid-cols-2; }
    .duo-side { @apply relative; }
    .duo-side img { @apply w-full h-64 object-cover bg-white/10; }
    .duo-side:first-child img { @apply border-r border-white/10; }
    .duo-label {
      @apply absolute top-3 left-3 text-xs uppercase tracking-wide font-bold
             px-2 py-1 rounded bg-app-negro/80 text-app-blanco;
    }
    .duo-label-after { @apply bg-app-azul; }
  `],
})
export class GaleriaPublicaComponent {
  private auth = inject(AuthService);
  private supa = inject(SupabaseService);

  items = signal<Galeria[]>([]);
  cargando = signal(true);
  isLoggedIn = () => this.auth.isAuthenticated();

  constructor() { this.cargar(); }
  private async cargar() {
    const { data } = await this.supa.client
      .from('appsalon_galeria')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false });
    this.items.set((data as Galeria[]) || []);
    this.cargando.set(false);
  }
}
