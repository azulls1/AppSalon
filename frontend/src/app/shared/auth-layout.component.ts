import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <main class="min-h-screen grid lg:grid-cols-2 bg-app-negro">
      <!-- Panel lateral con logo (desktop). Clickeable para volver al inicio. -->
      <a routerLink="/"
         class="hidden lg:flex items-center justify-center bg-cover bg-center relative
                hover:opacity-90 transition-opacity"
         style="background-image: linear-gradient(rgba(26,27,21,0.78), rgba(26,27,21,0.78)), url('/salon.jpg');"
         aria-label="Volver al sitio">
        <img src="/images/logo-transparent.png" alt="Mike's Club Barber Shop"
             class="w-80 xl:w-[28rem] drop-shadow-2xl" />
      </a>

      <section class="flex items-center justify-center p-6 lg:p-12 relative">
        <!-- Botón volver, visible siempre arriba a la izquierda -->
        <a routerLink="/" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="hidden sm:inline">Volver al sitio</span>
        </a>

        <!-- Logo flotante (mobile) -->
        <a routerLink="/" class="absolute right-4 top-4 lg:hidden" aria-label="Inicio">
          <img src="/images/logo-transparent.png" alt=""
               aria-hidden="true"
               class="h-14 w-auto object-contain" />
        </a>

        <div class="w-full max-w-md">
          <router-outlet></router-outlet>
        </div>
      </section>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";
    .back-link {
      @apply absolute top-4 left-4 inline-flex items-center gap-2
             px-3 py-2 rounded-md text-app-blanco/70 hover:text-app-oro
             text-xs font-bold uppercase tracking-[0.15em]
             hover:bg-app-oro/10 transition-colors z-10;
    }
    .back-link svg { @apply w-4 h-4; }
  `],
})
export class AuthLayoutComponent {}
