import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { PromoCliente } from '../core/models/promo';
import { ApiService } from '../core/services/api.service';
import { BarraNavComponent } from '../shared/barra-nav.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-promociones',
  imports: [RouterLink, CurrencyPipe, BarraNavComponent, RevealDirective],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Promociones</h1>
    <p class="text-app-blanco/60 mb-4">Beneficios exclusivos para clientes registrados</p>
    <app-barra-nav />

    @if (cargando()) {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card-skel"></div><div class="card-skel"></div>
      </div>
    } @else if (items().length === 0) {
      <div class="empty">
        <p class="text-3xl">🎁</p>
        <p class="text-lg font-bold text-app-blanco mt-2">Sin promociones activas</p>
        <p class="text-sm text-app-blanco/60 mt-1 max-w-md mx-auto">
          Pronto publicaremos descuentos exclusivos para ti. Mientras tanto, sigue
          acumulando puntos en cada visita.
        </p>
        <a routerLink="/recompensas" class="mt-5 btn-primary inline-block">Ver Recompensas</a>
      </div>
    } @else {
      <!-- Destacadas como banners grandes -->
      @if (destacadas().length > 0) {
        <div class="grid grid-cols-1 gap-4 mb-6">
          @for (p of destacadas(); track p.id) {
            <div class="promo-hero" appReveal="scale">
              @if (p.imagen_url) {
                <img [src]="p.imagen_url" alt="" class="promo-hero-img" />
              }
              <div class="promo-hero-body">
                <span class="promo-tag">{{ tipoLabel(p) }}</span>
                <h2 class="font-hero text-3xl lg:text-4xl text-app-blanco uppercase mt-1">{{ p.titulo }}</h2>
                @if (p.descripcion) {
                  <p class="text-app-blanco/80 mt-2 max-w-xl">{{ p.descripcion }}</p>
                }
                <div class="flex flex-wrap items-center gap-3 mt-4">
                  <p class="text-app-oro text-2xl font-black">{{ formatoValor(p) }}</p>
                  @if (p.codigo) {
                    <span class="codigo">Código: {{ p.codigo }}</span>
                  }
                  @if (p.vigencia_fin) {
                    <span class="text-xs text-app-blanco/60">Vigente hasta {{ p.vigencia_fin }}</span>
                  }
                </div>
                @if (p.elegible) {
                  <button (click)="canjear(p)" class="btn-primary mt-5">Apartar mi promoción</button>
                } @else {
                  <p class="text-xs text-amber-400 mt-5 font-bold">⚠ {{ p.motivo_no_elegible }}</p>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Regulares en grid -->
      @if (regulares().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (p of regulares(); track p.id; let i = $index) {
            <article class="promo-card" [class.bloqueada]="!p.elegible"
                     appReveal="up" [revealDelay]="i * 80">
              @if (p.imagen_url) {
                <img [src]="p.imagen_url" alt="" class="promo-card-img" />
              } @else {
                <div class="promo-card-img flex items-center justify-center text-app-oro text-4xl">★</div>
              }
              <div class="p-4 flex flex-col">
                <span class="promo-tag w-fit">{{ tipoLabel(p) }}</span>
                <p class="font-bold text-app-blanco text-lg mt-2">{{ p.titulo }}</p>
                @if (p.descripcion) {
                  <p class="text-sm text-app-blanco/60 mt-1 line-clamp-2">{{ p.descripcion }}</p>
                }
                <p class="text-app-oro font-black text-xl mt-2">{{ formatoValor(p) }}</p>
                @if (p.codigo) {
                  <p class="text-xs text-app-blanco/50 mt-1">Código: <span class="font-bold text-app-blanco">{{ p.codigo }}</span></p>
                }
                <div class="mt-auto pt-4">
                  @if (p.elegible) {
                    <button (click)="canjear(p)" class="btn-primary w-full">Apartar</button>
                  } @else {
                    <p class="text-xs text-amber-400 font-bold text-center">⚠ {{ p.motivo_no_elegible }}</p>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    }
  `,
  styles: [`
    @reference "../../styles.css";
    .btn-primary {
      @apply h-11 px-5 rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro
             font-bold uppercase tracking-wide transition-colors;
    }
    .empty {
      @apply text-center py-16 px-6 rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .card-skel {
      @apply rounded-lg bg-white/5 border border-white/10 h-48 animate-pulse;
    }

    /* Hero (destacadas) */
    .promo-hero {
      @apply relative rounded-xl overflow-hidden border border-app-oro/30
             bg-gradient-to-br from-app-oro/15 via-app-negro to-app-negro;
    }
    .promo-hero-img {
      @apply absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity;
    }
    .promo-hero-body { @apply relative p-6 lg:p-8; }
    .promo-tag {
      @apply text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded
             border border-app-oro/50 text-app-oro inline-block;
    }
    .codigo {
      @apply text-xs font-bold uppercase tracking-wider px-3 py-1 rounded
             bg-app-oro/20 text-app-oro border border-app-oro/40;
    }

    /* Card regular */
    .promo-card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             flex flex-col transition-all hover:border-app-oro/50;
    }
    .promo-card.bloqueada { @apply opacity-70; }
    .promo-card-img { @apply w-full h-40 object-cover bg-white/10; }
  `],
})
export class PromocionesComponent {
  private api = inject(ApiService);

  items = signal<PromoCliente[]>([]);
  cargando = signal(true);

  destacadas = computed(() => this.items().filter(p => p.destacada));
  regulares  = computed(() => this.items().filter(p => !p.destacada));

  constructor() {
    this.api.listPromos().subscribe({
      next: r => { this.items.set(r); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  tipoLabel(p: PromoCliente): string {
    return {
      descuento_pct:   'Descuento %',
      descuento_fijo:  'Descuento MXN',
      servicio_gratis: 'Servicio gratis',
      producto_gratis: 'Producto gratis',
    }[p.tipo] || 'Promoción';
  }

  formatoValor(p: PromoCliente): string {
    const v = Number(p.valor) || 0;
    switch (p.tipo) {
      case 'descuento_pct':   return `${v}% OFF`;
      case 'descuento_fijo':  return `$${v} OFF`;
      case 'servicio_gratis': return '¡GRATIS!';
      case 'producto_gratis': return '¡GRATIS!';
      default: return '';
    }
  }

  async canjear(p: PromoCliente) {
    const c = await Swal.fire({
      title: '¿Apartar esta promoción?',
      html: `<p>Vamos a guardar "<b>${p.titulo}</b>" a tu nombre. Muéstrale el código a tu barbero al llegar.</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, apartar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c7a24b', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!c.isConfirmed) return;
    this.api.canjearPromo(p.id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success', title: '¡Promoción apartada!',
          html: p.codigo
            ? `<p>Muéstrale este código a tu barbero:</p><h2 style="color:#c7a24b;margin-top:8px">${p.codigo}</h2>`
            : '<p>Tu barbero la aplicará automáticamente en tu próxima cita.</p>',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#c7a24b',
        });
        // Refrescar para que se actualice canjes_usados
        this.api.listPromos().subscribe(r => this.items.set(r));
      },
      error: (e) => {
        Swal.fire({
          icon: 'error', title: 'Error',
          text: e?.error?.detail ?? 'No se pudo apartar la promoción.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
        });
      },
    });
  }
}
