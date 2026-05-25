import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-ubicacion',
  imports: [RouterLink],
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
            <a routerLink="/galeria"   class="nav-link">Galería</a>
            <a routerLink="/ubicacion" class="nav-link-active">La Casa</a>
            @if (isLoggedIn()) {
              <a routerLink="/cita" class="btn-primary">Reservar</a>
            } @else {
              <a routerLink="/login" class="btn-ghost">Iniciar Sesión</a>
            }
          </nav>
        </div>
      </header>

      <section class="max-w-6xl mx-auto px-6 py-16">
        <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Visítanos</h1>
        <p class="text-app-blanco/70 text-center mb-12 max-w-2xl mx-auto">
          Encuéntranos en el corazón de la ciudad. Te esperamos con un café cortesía.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Mapa -->
          <div class="lg:col-span-2">
            <div class="mapa">
              <iframe
                src="https://www.google.com/maps?q=Polanco+Ciudad+de+M%C3%A9xico&output=embed"
                width="100%" height="450" style="border:0"
                loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>

          <!-- Info -->
          <aside class="space-y-4">
            <div class="info-card">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3 class="info-title">Dirección</h3>
              <p class="info-text">Av. Presidente Masaryk 169,<br>Polanco IV Sección,<br>11550 Ciudad de México</p>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="info-title">Horarios</h3>
              <ul class="info-text space-y-1">
                <li class="flex justify-between"><span>Lunes – Viernes</span><span class="font-bold text-app-blanco">10:00 – 18:00</span></li>
                <li class="flex justify-between"><span>Sábados</span><span class="text-app-blanco/40">Cerrado</span></li>
                <li class="flex justify-between"><span>Domingos</span><span class="text-app-blanco/40">Cerrado</span></li>
              </ul>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="info-title">Contacto</h3>
              <p class="info-text">
                <a href="tel:+525555555555" class="hover:text-app-azul">+52 55 5555 5555</a><br>
                <a href="mailto:hola@appsalon.com" class="hover:text-app-azul">hola&#64;appsalon.com</a>
              </p>
            </div>
          </aside>
        </div>

        <!-- ¿Cómo llegar? -->
        <section class="mt-16">
          <h2 class="text-2xl font-black text-app-blanco mb-6 text-center">Cómo llegar</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="travel">
              <div class="travel-icon">🚇</div>
              <p class="travel-title">Metro</p>
              <p class="travel-text">Línea 7 · Estación Polanco, a 5 min caminando.</p>
            </div>
            <div class="travel">
              <div class="travel-icon">🚗</div>
              <p class="travel-title">Auto</p>
              <p class="travel-text">Valet parking disponible al frente. Estacionamiento público a 1 calle.</p>
            </div>
            <div class="travel">
              <div class="travel-icon">🚲</div>
              <p class="travel-title">Bicicleta</p>
              <p class="travel-text">Cicloestación Ecobici #271 en la esquina. Bicipuesto interior.</p>
            </div>
          </div>
        </section>
      </section>

      <footer class="border-t border-white/10 py-8 mt-12">
        <div class="max-w-6xl mx-auto px-6 text-center text-app-blanco/50 text-sm">
          © 2026 AppSalon · Tu salón de belleza de confianza
        </div>
      </footer>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";
    .btn-primary {
      @apply rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-5 py-2.5
             text-sm font-bold uppercase tracking-wide transition-colors;
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
      @apply w-11 h-11 rounded-md object-contain
             ring-1 ring-app-oro/40 bg-app-negro shrink-0;
    }

    .mapa { @apply rounded-lg overflow-hidden border border-white/15 bg-white/5; }
    .mapa iframe { display: block; }

    .info-card {
      @apply rounded-lg bg-white/5 border border-white/15 p-5;
    }
    .info-icon {
      @apply w-10 h-10 rounded-md bg-app-azul/15 text-app-azul
             flex items-center justify-center mb-3;
    }
    .info-icon svg { @apply w-5 h-5; }
    .info-title { @apply font-bold text-app-blanco mb-1; }
    .info-text { @apply text-sm text-app-blanco/70 leading-relaxed; }

    .travel {
      @apply rounded-lg bg-white/5 border border-white/15 p-5 text-center;
    }
    .travel-icon { @apply text-3xl mb-2; }
    .travel-title { @apply font-bold text-app-blanco; }
    .travel-text { @apply text-sm text-app-blanco/60 mt-1; }
  `],
})
export class UbicacionComponent {
  private auth = inject(AuthService);
  isLoggedIn = () => this.auth.isAuthenticated();
}
