import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Canje, Recompensa } from '../core/models/recompensa';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { BarraNavComponent } from '../shared/barra-nav.component';

@Component({
  selector: 'app-recompensas',
  imports: [RouterLink, DatePipe, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Recompensas</h1>
    <p class="text-app-blanco/60 mb-4">Canjea tus puntos por premios reales</p>
    <app-barra-nav />

    <div class="balance">
      <div class="balance-icon">★</div>
      <div>
        <p class="text-xs uppercase tracking-wide font-bold text-app-blanco/60">Tu saldo</p>
        <p class="text-3xl font-black text-app-blanco">{{ puntos() }} pts</p>
      </div>
      <div class="ml-auto text-right">
        <p class="text-xs uppercase tracking-wide font-bold text-app-blanco/60">Próxima recompensa</p>
        <p class="text-app-azul font-bold">{{ proximaRecompensa() }}</p>
      </div>
    </div>

    <h2 class="text-2xl font-black text-app-blanco mt-8 mb-4">Catálogo</h2>
    @if (cargando()) {
      <p class="text-app-blanco/60">Cargando recompensas...</p>
    } @else if (recompensas().length === 0) {
      <p class="text-app-blanco/60">Aún no hay recompensas disponibles.</p>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (r of recompensas(); track r.id) {
          <article class="card" [class.locked]="puntos() < r.puntos_costo">
            @if (r.foto_url) {
              <img [src]="r.foto_url" [alt]="r.nombre" class="card-img" />
            } @else {
              <div class="card-img-fallback">★</div>
            }
            <div class="card-body">
              <p class="font-bold text-app-blanco leading-tight">{{ r.nombre }}</p>
              @if (r.descripcion) {
                <p class="text-xs text-app-blanco/60 mt-1">{{ r.descripcion }}</p>
              }
              <div class="card-meta">
                <span class="costo">{{ r.puntos_costo }} pts</span>
                @if (r.stock !== null) {
                  <span class="stock">{{ r.stock }} disponibles</span>
                }
              </div>
              <button (click)="canjear(r)" [disabled]="puntos() < r.puntos_costo || (r.stock !== null && r.stock <= 0)"
                      class="btn-canjear">
                @if (puntos() < r.puntos_costo) {
                  Faltan {{ r.puntos_costo - puntos() }} pts
                } @else if (r.stock === 0) {
                  Sin stock
                } @else {
                  Canjear
                }
              </button>
            </div>
          </article>
        }
      </div>
    }

    @if (canjes().length > 0) {
      <h2 class="text-2xl font-black text-app-blanco mt-12 mb-4">Mis Canjes</h2>
      <ul class="space-y-2">
        @for (c of canjes(); track c.id) {
          <li class="canje">
            <div>
              <p class="font-bold text-app-blanco">{{ c.recompensa_nombre ?? '—' }}</p>
              <p class="text-xs text-app-blanco/60">{{ c.created_at | date:'mediumDate':'':'es-MX' }} · {{ c.puntos_descontados }} pts</p>
            </div>
            <div class="text-right">
              <p class="codigo">{{ c.codigo }}</p>
              <p class="text-xs text-app-blanco/60 uppercase tracking-wide font-bold">{{ c.estado }}</p>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    @reference "../../styles.css";
    .balance {
      @apply flex items-center gap-4 rounded-lg p-5 border border-app-azul/30
             bg-gradient-to-r from-app-azul/15 to-app-azul/5;
    }
    .balance-icon {
      @apply w-14 h-14 rounded-full bg-app-azul/30 text-amber-400 text-3xl font-black
             flex items-center justify-center;
    }

    .card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             transition-all flex flex-col;
    }
    .card.locked { @apply opacity-60; }
    .card-img { @apply w-full h-40 object-cover bg-white/10; }
    .card-img-fallback {
      @apply w-full h-40 bg-app-azul/15 text-amber-400 text-5xl font-black
             flex items-center justify-center;
    }
    .card-body { @apply p-4 flex-1 flex flex-col; }
    .card-meta { @apply flex items-center justify-between mt-2 text-xs; }
    .costo {
      @apply text-amber-400 font-black text-base;
    }
    .stock { @apply text-app-blanco/60 font-bold; }
    .btn-canjear {
      @apply mt-3 w-full rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco
             py-2.5 font-bold uppercase tracking-wide text-sm transition-colors
             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-app-azul;
    }

    .canje {
      @apply flex items-center justify-between gap-3 p-4 rounded-lg
             bg-white/5 border border-white/15;
    }
    .codigo {
      @apply font-mono text-base text-app-azul font-black;
    }
  `],
})
export class RecompensasComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  recompensas = signal<Recompensa[]>([]);
  canjes = signal<Canje[]>([]);
  puntos = signal(0);
  cargando = signal(true);

  proximaRecompensa = computed(() => {
    const pendientes = this.recompensas().filter(r => r.activa && (r.stock ?? 1) > 0 && r.puntos_costo > this.puntos());
    if (pendientes.length === 0) return '¡Tienes para todo!';
    const r = pendientes.sort((a, b) => a.puntos_costo - b.puntos_costo)[0];
    return `${r.nombre} · faltan ${r.puntos_costo - this.puntos()} pts`;
  });

  constructor() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.api.getMe().subscribe(p => this.puntos.set(p.puntos ?? 0));
    this.recargar();
  }

  recargar() {
    this.cargando.set(true);
    this.api.listRecompensas().subscribe({
      next: r => { this.recompensas.set(r.filter(x => x.activa)); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
    this.api.misCanjes().subscribe(c => this.canjes.set(c));
  }

  async canjear(r: Recompensa) {
    const c = await Swal.fire({
      title: `¿Canjear "${r.nombre}"?`,
      html: `<p style="margin-top:8px;font-size:14px;opacity:.8">Se descontarán <b>${r.puntos_costo} puntos</b> y recibirás un código para usar en el salón.</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, canjear', cancelButtonText: 'Mejor no',
      confirmButtonColor: '#0da6f3', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!c.isConfirmed) return;

    this.api.canjearRecompensa(r.id).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: '¡Recompensa canjeada!',
          html: `
            <p style="margin-bottom:12px">Muestra este código en tu próxima visita:</p>
            <p style="font-family:monospace;font-size:24px;font-weight:900;color:#0da6f3;padding:12px;background:rgba(13,166,243,.1);border-radius:8px;letter-spacing:2px">${res.codigo}</p>
            <p style="margin-top:12px;font-size:13px;opacity:.7">Saldo restante: <b>${res.puntos_restantes} pts</b></p>`,
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#0da6f3',
        }).then(() => this.recargar());
      },
      error: (e) => Swal.fire({
        icon: 'error', title: 'No se pudo canjear',
        text: e?.error?.detail ?? 'Intenta de nuevo más tarde.',
        background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
      }),
    });
  }
}
