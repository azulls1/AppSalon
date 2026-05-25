import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <main class="min-h-screen bg-app-negro text-app-blanco">
      <header class="border-b border-white/10 bg-app-negro/90 backdrop-blur sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2.5" aria-label="Volver al sitio público">
            <img src="/images/logo-transparent.png" alt="Mike's Club Barber Shop" class="brand-logo-mini" />
            <span class="font-hero text-xl tracking-wider">
              <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
            </span>
            <span class="tag-mini">Barbería</span>
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
    .tag-mini {
      @apply text-[10px] uppercase tracking-[0.2em] font-bold px-1.5 py-0.5 rounded
             border border-app-oro/40 text-app-oro;
    }
    .brand-logo-mini {
      @apply h-11 w-auto object-contain shrink-0;
    }
  `],
})
export class AppLayoutComponent {}
