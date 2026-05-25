import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-barra-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="flex items-center justify-between border-b border-white/15 pb-4 mb-6 gap-3">
      <div class="min-w-0">
        <p class="text-sm text-app-blanco/70 truncate">
          Hola:
          <span class="font-bold text-app-blanco">{{ nombre() }}</span>
          @if (isAdmin()) {
            <span class="ml-2 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-app-azul/20 text-app-azul border border-app-azul/40">Admin</span>
          }
        </p>
        @if (!isAdmin() && puntos() > 0) {
          <p class="text-xs text-amber-400 font-bold mt-0.5">
            ★ {{ puntos() }} puntos acumulados
          </p>
        }
      </div>
      <button (click)="logout()"
              class="px-4 py-2 text-sm rounded bg-app-rojo text-app-blanco font-bold uppercase tracking-wide hover:opacity-90 shrink-0">
        Cerrar Sesión
      </button>
    </div>

    @if (isAdmin()) {
      <div class="flex flex-wrap gap-2 mb-6">
        <a routerLink="/admin"               routerLinkActive="nav-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-btn">Citas</a>
        <a routerLink="/servicios"           routerLinkActive="nav-active" class="nav-btn">Servicios</a>
        <a routerLink="/admin/staff"         routerLinkActive="nav-active" class="nav-btn">Estilistas</a>
        <a routerLink="/admin/galeria"       routerLinkActive="nav-active" class="nav-btn">Galería</a>
        <a routerLink="/admin/recompensas"   routerLinkActive="nav-active" class="nav-btn">Recompensas</a>
      </div>
    } @else {
      <div class="flex flex-wrap gap-2 mb-6">
        <a routerLink="/cita"        routerLinkActive="nav-active" class="nav-btn">Nueva Cita</a>
        <a routerLink="/mis-citas"   routerLinkActive="nav-active" class="nav-btn">Mis Citas</a>
        <a routerLink="/recompensas" routerLinkActive="nav-active" class="nav-btn">Recompensas ★</a>
      </div>
    }
  `,
  styles: [`
    @reference "../../styles.css";
    .nav-btn {
      @apply px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/15
             text-app-blanco font-bold uppercase tracking-wide transition-colors;
    }
    .nav-active {
      @apply bg-app-azul hover:bg-app-azul-hover;
    }
  `],
})
export class BarraNavComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  nombre = signal('');
  isAdmin = signal(false);
  puntos = signal(0);

  constructor() {
    this.api.getMe().subscribe({
      next: (p) => {
        this.nombre.set(`${p.nombre} ${p.apellido}`.trim());
        this.isAdmin.set(p.is_admin);
        this.puntos.set(p.puntos ?? 0);
      },
      error: () => this.nombre.set(this.auth.user()?.email ?? ''),
    });
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
