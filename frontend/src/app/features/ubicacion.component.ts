import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { FooterPublicoComponent } from '../shared/footer-publico.component';

@Component({
  selector: 'app-ubicacion',
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
          Encuéntranos en Cuautitlán Centro. Te esperamos con un café cortesía
          y la silla lista.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Mapa -->
          <div class="lg:col-span-2">
            <div class="mapa">
              <iframe
                src="https://www.google.com/maps?q=Cuautitl%C3%A1n+Centro%2C+Estado+de+M%C3%A9xico&output=embed"
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
              <p class="info-text">Cuautitlán Centro,<br>Estado de México</p>
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
                <li class="flex justify-between"><span>Lunes – Sábado</span><span class="font-bold text-app-blanco">10:00 – 20:00</span></li>
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
                <a href="tel:+525633493004" class="hover:text-app-oro font-bold text-app-blanco">📲 56 3349 3004</a><br>
                <a href="https://wa.me/525633493004" target="_blank" rel="noopener" class="hover:text-app-oro">WhatsApp directo →</a>
              </p>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10z" opacity="0"/>
                </svg>
                <span class="text-lg">✦</span>
              </div>
              <h3 class="info-title">Síguenos</h3>
              <div class="flex flex-col gap-2 mt-2">
                <a href="https://www.instagram.com/barbershopmikesclub" target="_blank" rel="noopener" class="social-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="18" cy="6" r="1" fill="currentColor"/>
                  </svg>
                  &#64;barbershopmikesclub
                </a>
                <a href="https://www.facebook.com/61585346703843" target="_blank" rel="noopener" class="social-link">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/>
                  </svg>
                  Facebook
                </a>
                <a href="https://vt.tiktok.com/ZSxfY2ULs/" target="_blank" rel="noopener" class="social-link">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1.84-.13z"/>
                  </svg>
                  TikTok
                </a>
              </div>
            </div>
          </aside>
        </div>

        <!-- ¿Por qué Mike's Club? -->
        <section class="mt-16">
          <h2 class="text-2xl font-black text-app-blanco mb-6 text-center">Lo que vas a encontrar</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="travel">
              <div class="travel-icon">✂️</div>
              <p class="travel-title">Cortes Modernos</p>
              <p class="travel-text">Fades, texturizados y diseños al detalle.</p>
            </div>
            <div class="travel">
              <div class="travel-icon">🧼</div>
              <p class="travel-title">Premium</p>
              <p class="travel-text">Cada cliente, una experiencia cuidada.</p>
            </div>
            <div class="travel">
              <div class="travel-icon">❄️</div>
              <p class="travel-title">Clima</p>
              <p class="travel-text">Ambiente fresco todo el año.</p>
            </div>
            <div class="travel">
              <div class="travel-icon">😌</div>
              <p class="travel-title">Relajación</p>
              <p class="travel-text">Cierre con masaje y toalla caliente.</p>
            </div>
          </div>
        </section>
      </section>

      <app-footer-publico></app-footer-publico>
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
      @apply h-14 w-auto object-contain shrink-0;
      mix-blend-mode: screen;
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

    .social-link {
      @apply inline-flex items-center gap-2 text-sm text-app-blanco/80
             hover:text-app-oro transition-colors;
    }
    .social-link svg { @apply w-4 h-4; }
  `],
})
export class UbicacionComponent {
  private auth = inject(AuthService);
  isLoggedIn = () => this.auth.isAuthenticated();
}
