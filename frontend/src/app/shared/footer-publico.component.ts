import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-publico',
  standalone: true,
  template: `
    <footer class="border-t border-app-oro/15 bg-app-negro-soft">
      <div class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <img src="/images/logo-transparent.png" alt="Mike's Club Barber Shop" class="footer-logo" />
            <span class="logo font-hero text-xl">
              <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
            </span>
          </div>
          <p class="text-app-blanco/60 text-sm leading-relaxed">
            Mike's Club Barber Shop. Cortes modernos, experiencia premium
            y la relajación que mereces al final.
          </p>
        </div>

        <div>
          <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-3">Contacto</p>
          <ul class="space-y-2 text-sm text-app-blanco/70">
            <li>📍 Cuautitlán Centro, Edo. Méx.</li>
            <li>
              <a href="tel:+525633493004" class="hover:text-app-oro font-bold text-app-blanco">📲 56 3349 3004</a>
            </li>
            <li>
              <a href="https://wa.me/525633493004" target="_blank" rel="noopener" class="hover:text-app-oro">WhatsApp</a>
            </li>
            <li>🕐 Lun – Sáb · 10:00 – 20:00</li>
          </ul>
        </div>

        <div>
          <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-3">Síguenos</p>
          <div class="flex flex-col gap-2.5">
            <a href="https://www.instagram.com/barbershopmikesclub" target="_blank" rel="noopener" class="foot-social">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="18" cy="6" r="1" fill="currentColor"/>
              </svg>
              &#64;barbershopmikesclub
            </a>
            <a href="https://www.facebook.com/61585346703843" target="_blank" rel="noopener" class="foot-social">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/>
              </svg>
              Facebook
            </a>
            <a href="https://vt.tiktok.com/ZSxfY2ULs/" target="_blank" rel="noopener" class="foot-social">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1.84-.13z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>
      </div>
      <div class="border-t border-app-oro/10 py-4">
        <div class="max-w-6xl mx-auto px-6 text-center text-app-blanco/40 text-xs">
          © 2026 Mike's Club Barber Shop · Cuautitlán, Edo. Méx. · Todos los derechos reservados
        </div>
      </div>
    </footer>
  `,
  styles: [`
    @reference "../../styles.css";

    .footer-logo {
      @apply h-10 w-auto object-contain shrink-0;
    }
    .logo { letter-spacing: 0.05em; }

    .foot-social {
      @apply inline-flex items-center gap-2 text-sm text-app-blanco/70
             hover:text-app-oro transition-colors;
    }
    .foot-social svg { @apply w-4 h-4 shrink-0; }
  `],
})
export class FooterPublicoComponent {}
