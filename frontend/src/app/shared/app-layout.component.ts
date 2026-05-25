import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <main class="min-h-screen bg-app-negro text-app-blanco">
      <header class="border-b border-white/10 bg-app-negro/90 backdrop-blur sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2.5" aria-label="Ir al inicio">
            <img src="/images/logo.jpg" alt="Mike's Club Barber Shop" class="brand-logo-mini" />
            <span class="font-hero text-xl tracking-wider">
              <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
            </span>
            <span class="tag-mini">Barbería</span>
          </a>
          <a routerLink="/" class="nav-home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="hidden sm:inline">Inicio</span>
          </a>
        </div>
      </header>
      <div class="max-w-4xl mx-auto p-6 lg:p-10">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";
    .nav-home {
      @apply inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-app-blanco/60
             text-sm font-bold uppercase tracking-wide
             hover:bg-app-oro/10 hover:text-app-oro transition-colors;
    }
    .nav-home svg { @apply w-4 h-4; }
    .tag-mini {
      @apply text-[10px] uppercase tracking-[0.2em] font-bold px-1.5 py-0.5 rounded
             border border-app-oro/40 text-app-oro;
    }
    .brand-logo-mini {
      @apply w-9 h-9 rounded-md object-contain
             ring-1 ring-app-oro/40 bg-app-negro shrink-0;
    }
  `],
})
export class AppLayoutComponent {}
