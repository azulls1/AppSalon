import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SupabaseService } from '../core/services/supabase.service';

export type ActiveTab = 'inicio' | 'barberos' | 'galeria' | 'ubicacion' | null;

@Component({
  selector: 'app-header-publico',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="border-b border-app-oro/15 bg-app-negro/95 backdrop-blur sticky top-0 z-20">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
        <a routerLink="/" class="flex items-center gap-3 shrink-0" aria-label="Inicio">
          <img src="/images/logo-transparent.png" alt="Mike's Club Barber Shop"
               class="brand-logo" />
          <span class="logo font-hero text-2xl whitespace-nowrap">
            <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
          </span>
          <span class="tag hidden sm:inline-block">Barbería</span>
        </a>

        <nav class="flex items-center gap-1 sm:gap-2">
          <a routerLink="/"          [class]="navClass('inicio')"    class="hidden sm:inline-block">Inicio</a>
          <a routerLink="/equipo"    [class]="navClass('barberos')"  class="hidden sm:inline-block">Barberos</a>
          <a routerLink="/galeria"   [class]="navClass('galeria')"   class="hidden sm:inline-block">Galería</a>
          <a routerLink="/ubicacion" [class]="navClass('ubicacion')" class="hidden sm:inline-block">La Casa</a>

          @if (isAuthed()) {
            <a [routerLink]="dashboardLink()" class="btn-primary">
              {{ isAdmin() ? 'Panel' : 'Mi Cuenta' }}
            </a>
          } @else {
            <a routerLink="/login" class="btn-ghost">Entrar</a>
            <a routerLink="/cita" class="btn-primary">Reservar</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [`
    @reference "../../styles.css";

    .logo { letter-spacing: 0.05em; }
    .tag {
      @apply text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded
             border border-app-oro/50 text-app-oro;
    }
    .brand-logo {
      @apply h-14 w-auto object-contain shrink-0;
    }

    .nav-link, .nav-link-active {
      @apply text-xs font-bold uppercase tracking-[0.15em]
             transition-colors px-3 py-2;
      position: relative;
    }
    .nav-link        { @apply text-app-blanco/60 hover:text-app-oro; }
    .nav-link-active { @apply text-app-oro; }

    .nav-link::after, .nav-link-active::after {
      content: '';
      position: absolute;
      left: 12px; right: 12px; bottom: 4px;
      height: 2px;
      background: var(--color-app-oro);
      transform: scaleX(0);
      transform-origin: right center;
      transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .nav-link:hover::after  { transform: scaleX(1); transform-origin: left center; }
    .nav-link-active::after { transform: scaleX(1); }

    .btn-primary {
      @apply rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro px-5 py-2.5
             text-sm font-bold uppercase tracking-wider transition-colors inline-block
             whitespace-nowrap;
    }
    .btn-ghost {
      @apply rounded-md border border-app-oro/40 hover:bg-app-oro/10 text-app-blanco px-5 py-2.5
             text-sm font-bold uppercase tracking-wider transition-colors inline-block
             whitespace-nowrap;
    }
  `],
})
export class HeaderPublicoComponent {
  private auth = inject(AuthService);
  private supa = inject(SupabaseService);

  @Input() active: ActiveTab = null;

  readonly isAuthed = this.auth.isAuthenticated;

  // Sólo consultamos is_admin si hay sesión y vía Supabase (sin pegar al backend
  // en cada pintado del header).
  private adminCache = new Map<string, boolean>();
  readonly isAdmin = computed(() => {
    const u = this.auth.user();
    if (!u) return false;
    if (this.adminCache.has(u.id)) return this.adminCache.get(u.id)!;
    this.supa.client
      .from('appsalon_profiles')
      .select('is_admin')
      .eq('id', u.id)
      .single()
      .then(({ data }) => this.adminCache.set(u.id, !!data?.is_admin));
    return false;
  });

  readonly dashboardLink = computed(() => (this.isAdmin() ? '/admin' : '/cita'));

  navClass(tab: ActiveTab): string {
    return this.active === tab ? 'nav-link-active' : 'nav-link';
  }
}
