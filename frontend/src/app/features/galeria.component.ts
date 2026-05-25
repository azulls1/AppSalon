import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SupabaseService } from '../core/services/supabase.service';
import { Galeria } from '../core/models/galeria';
import { FooterPublicoComponent } from '../shared/footer-publico.component';
import { HeaderPublicoComponent } from '../shared/header-publico.component';

@Component({
  selector: 'app-galeria',
  imports: [RouterLink, FooterPublicoComponent, HeaderPublicoComponent],
  template: `
    <main class="min-h-screen bg-app-negro">
      <app-header-publico active="galeria"></app-header-publico>

      <section class="max-w-6xl mx-auto px-6 py-16">
        <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase text-center mb-3">Trabajo Real</p>
        <h1 class="font-hero text-5xl lg:text-7xl text-app-blanco text-center uppercase mb-4">Antes y Después</h1>
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
      @apply rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro px-5 py-2.5
             text-sm font-bold uppercase tracking-wide transition-colors inline-block;
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
