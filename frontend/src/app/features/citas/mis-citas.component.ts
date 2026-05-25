import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Cita } from '../../core/models/cita';
import { PromoCliente } from '../../core/models/promo';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

type Filtro = 'proximas' | 'pasadas' | 'canceladas' | 'todas';

@Component({
  selector: 'app-mis-citas',
  imports: [CurrencyPipe, RouterLink, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Mis Citas</h1>
    <p class="text-app-blanco/60 mb-4">Historial completo de tus reservas</p>
    <app-barra-nav />

    @if (promoDestacada(); as p) {
      <a routerLink="/cita" class="promo-banner">
        <div class="promo-banner-icon">★</div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-app-oro">Promoción para ti</p>
          <p class="font-hero text-2xl text-app-blanco uppercase mt-0.5 truncate">{{ p.titulo }}</p>
          @if (p.descripcion) {
            <p class="text-sm text-app-blanco/70 mt-1 line-clamp-1">{{ p.descripcion }}</p>
          }
        </div>
        <div class="promo-banner-cta">
          <p class="text-app-oro font-black text-xl leading-none">{{ formatoValorPromo(p) }}</p>
          <p class="text-[10px] uppercase tracking-wide text-app-blanco/60 mt-1">Aplicar →</p>
        </div>
      </a>
    }

    <!-- Filter pills + contador -->
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <div class="flex gap-1 p-1 rounded-md bg-white/5 border border-white/15">
        @for (f of filtros; track f.value) {
          <button (click)="filtro.set(f.value)"
                  [class]="filtro() === f.value ? 'pill pill-active' : 'pill'">
            {{ f.label }}
            <span class="ml-1 text-[10px] opacity-60">{{ count(f.value) }}</span>
          </button>
        }
      </div>
      <span class="text-app-blanco/50 text-sm ml-auto">
        {{ visibles().length }} cita{{ visibles().length === 1 ? '' : 's' }}
      </span>
    </div>

    <!-- Lista / empty -->
    @if (cargando()) {
      <div class="space-y-3">
        @for (i of [1,2]; track i) { <div class="card-skel"></div> }
      </div>
    } @else if (visibles().length === 0) {
      <div class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="3" y="5" width="18" height="16" rx="2"/>
          <path d="M16 3v4M8 3v4M3 11h18" stroke-linecap="round"/>
        </svg>
        <p class="text-lg font-bold text-app-blanco mt-3">
          @switch (filtro()) {
            @case ('proximas')   { Aún no tienes citas próximas }
            @case ('pasadas')    { No hay citas pasadas }
            @case ('canceladas') { No tienes citas canceladas }
            @default             { Aún no tienes citas reservadas }
          }
        </p>
        <p class="text-sm text-app-blanco/60 mt-1">¿Listo para tu próxima visita?</p>
        <a routerLink="/cita" class="mt-5 btn-primary inline-block">Reservar Ahora</a>
      </div>
    } @else {
      <ul class="space-y-3">
        @for (c of visibles(); track c.id) {
          <li class="cita" [class.cancelada]="c.estado === 'cancelada'">
            <div class="cita-fecha">
              <span class="dow">{{ obtenerDow(c.fecha) }}</span>
              <span class="num">{{ obtenerDia(c.fecha) }}</span>
              <span class="mon">{{ obtenerMes(c.fecha) }}</span>
            </div>
            <div class="cita-body">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-app-azul font-black text-xl">{{ obtenerHora(c.hora) }}</span>
                <span [class]="badgeClass(c.estado)">{{ etiquetaEstado(c.estado) }}</span>
              </div>
              @if (c.staff_nombre) {
                <p class="text-xs text-app-blanco/70 mb-2">
                  Con <span class="font-bold text-app-blanco">{{ c.staff_nombre }}</span>
                </p>
              }
              <div class="flex flex-wrap gap-1.5 mb-3">
                @for (s of c.servicios; track s.servicio_id) {
                  <span class="chip">{{ s.nombre }}</span>
                }
                @if (c.servicios.length === 0) {
                  <span class="text-xs text-app-blanco/50">Sin servicios registrados</span>
                }
              </div>
              @if (c.notas) {
                <p class="text-xs text-app-blanco/60 italic mb-3">"{{ c.notas }}"</p>
              }
              <div class="flex items-center justify-between border-t border-white/10 pt-3">
                <div class="text-xs text-app-blanco/60">
                  {{ frasePosicion(c.fecha) }}
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-app-blanco font-black">{{ +c.total | currency:'MXN' }}</span>
                  @if (puedeCancelar(c)) {
                    <button (click)="confirmarCancelar(c)" class="btn-cancelar">Cancelar</button>
                  }
                  @if (puedeResenar(c)) {
                    <button (click)="resenar(c)" class="btn-resena">Calificar ★</button>
                  }
                </div>
              </div>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    @reference "../../../styles.css";

    .pill {
      @apply px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded
             text-app-blanco/60 hover:text-app-blanco transition-colors;
    }
    .pill-active { @apply bg-app-azul text-app-blanco; }

    .empty {
      @apply flex flex-col items-center justify-center text-center py-16 px-6
             rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .empty-icon { @apply w-16 h-16 text-app-blanco/25; }

    .card-skel { @apply h-32 rounded-lg bg-white/5 border border-white/10 animate-pulse; }

    .cita {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             flex flex-col sm:flex-row;
    }
    .cita.cancelada { @apply opacity-50; }

    .cita-fecha {
      @apply bg-app-azul/15 border-b sm:border-b-0 sm:border-r border-white/10 p-4 sm:w-24
             flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0.5;
    }
    .dow { @apply text-[10px] uppercase tracking-wide font-bold text-app-blanco/70; }
    .num { @apply text-3xl font-black text-app-blanco leading-none; }
    .mon { @apply text-[10px] uppercase tracking-wide font-bold text-app-blanco/70; }

    .cita-body { @apply flex-1 p-4 min-w-0; }

    .chip {
      @apply text-xs px-2.5 py-1 rounded-full bg-app-azul/15 border border-app-azul/30
             text-app-azul font-bold;
    }

    .badge {
      @apply text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full shrink-0;
    }
    .badge-pendiente   { @apply bg-amber-500/20 text-amber-300 border border-amber-500/40; }
    .badge-confirmada  { @apply bg-app-verde/20 text-app-verde border border-app-verde/40; }
    .badge-completada  { @apply bg-app-blanco/10 text-app-blanco/60 border border-app-blanco/20; }
    .badge-cancelada   { @apply bg-app-rojo/20 text-app-rojo border border-app-rojo/40; }

    .btn-cancelar {
      @apply text-xs px-3 py-1.5 rounded bg-app-rojo/15 hover:bg-app-rojo/25
             text-app-rojo font-bold uppercase tracking-wide transition-colors;
    }
    .btn-resena {
      @apply text-xs px-3 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25
             text-amber-300 font-bold uppercase tracking-wide transition-colors;
    }
    .btn-primary {
      @apply h-11 px-6 rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco
             font-bold uppercase tracking-wide transition-colors;
    }

    .promo-banner {
      @apply flex items-center gap-4 p-4 sm:p-5 mb-6
             rounded-lg border border-app-oro/40
             bg-gradient-to-r from-app-oro/15 via-app-oro/5 to-transparent
             transition-all hover:border-app-oro/70 hover:from-app-oro/25;
    }
    .promo-banner-icon {
      @apply w-12 h-12 rounded-full bg-app-oro text-app-negro
             flex items-center justify-center text-2xl font-black shrink-0;
    }
    .promo-banner-cta { @apply text-right shrink-0; }
  `],
})
export class MisCitasComponent {
  private api = inject(ApiService);

  citas = signal<Cita[]>([]);
  cargando = signal(true);
  filtro = signal<Filtro>('proximas');

  promos = signal<PromoCliente[]>([]);
  promoDestacada = computed<PromoCliente | null>(() => {
    return this.promos().find(p => p.destacada && p.elegible) ?? null;
  });

  readonly filtros: { value: Filtro; label: string }[] = [
    { value: 'proximas',   label: 'Próximas'  },
    { value: 'pasadas',    label: 'Pasadas'   },
    { value: 'canceladas', label: 'Canceladas'},
    { value: 'todas',      label: 'Todas'     },
  ];

  private hoyISO = new Date().toISOString().slice(0, 10);

  visibles = computed(() => this.citas().filter(c => this.coincide(c, this.filtro())));

  count(f: Filtro): number {
    return this.citas().filter(c => this.coincide(c, f)).length;
  }

  private coincide(c: Cita, f: Filtro): boolean {
    if (f === 'todas') return true;
    if (f === 'canceladas') return c.estado === 'cancelada';
    const futura = c.fecha >= this.hoyISO && c.estado !== 'cancelada';
    if (f === 'proximas') return futura;
    if (f === 'pasadas')  return !futura && c.estado !== 'cancelada';
    return false;
  }

  constructor() {
    this.recargar();
    this.api.listPromos().subscribe({
      next: r => this.promos.set(r),
      error: () => this.promos.set([]),
    });
  }

  formatoValorPromo(p: PromoCliente): string {
    const v = Number(p.valor) || 0;
    switch (p.tipo) {
      case 'descuento_pct':   return `${v}% OFF`;
      case 'descuento_fijo':  return `$${v} OFF`;
      case 'servicio_gratis': return '¡GRATIS!';
      case 'producto_gratis': return '¡GRATIS!';
      default: return '';
    }
  }

  recargar() {
    this.cargando.set(true);
    this.api.listMyCitas().subscribe({
      next: cs => {
        // ordenar próximas primero
        const sorted = [...cs].sort((a, b) =>
          (b.fecha + b.hora).localeCompare(a.fecha + a.hora)
        );
        this.citas.set(sorted);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  puedeCancelar(c: Cita): boolean {
    return c.estado !== 'cancelada' && c.fecha >= this.hoyISO;
  }

  puedeResenar(c: Cita): boolean {
    return c.estado !== 'cancelada' && c.fecha < this.hoyISO;
  }

  async resenar(c: Cita) {
    const r = await Swal.fire({
      title: '¿Cómo estuvo tu cita?',
      html: `
        <div style="text-align:center">
          ${c.staff_nombre ? `<p style="font-size:13px;opacity:.7;margin-bottom:12px">Con <b>${c.staff_nombre}</b></p>` : ''}
          <div id="stars" style="font-size:36px;cursor:pointer;letter-spacing:6px;color:#525252">
            <span data-r="1">★</span><span data-r="2">★</span><span data-r="3">★</span><span data-r="4">★</span><span data-r="5">★</span>
          </div>
          <textarea id="coment" maxlength="500" rows="3" placeholder="Comparte tu experiencia (opcional)"
            style="width:100%;margin-top:14px;padding:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:6px;resize:vertical"></textarea>
        </div>`,
      background: '#1a1b15',
      color: '#ffffff',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0da6f3',
      cancelButtonColor: '#525252',
      didOpen: () => {
        let r = 0;
        const stars = (document.getElementById('stars') as HTMLElement);
        const sp = stars.querySelectorAll<HTMLSpanElement>('span');
        const paint = (n: number) => sp.forEach((s, i) => s.style.color = i < n ? '#fbbf24' : '#525252');
        sp.forEach(s => s.addEventListener('click', () => {
          r = Number(s.dataset['r']); paint(r); stars.setAttribute('data-r', String(r));
        }));
      },
      preConfirm: () => {
        const r = Number(document.getElementById('stars')?.getAttribute('data-r') ?? '0');
        const comentario = (document.getElementById('coment') as HTMLTextAreaElement)?.value?.trim() || null;
        if (r < 1 || r > 5) {
          Swal.showValidationMessage('Toca una estrella para calificar');
          return false;
        }
        return { rating: r, comentario };
      },
    });
    if (!r.isConfirmed || !r.value) return;
    this.api.createResena({ cita_id: c.id, rating: r.value.rating, comentario: r.value.comentario })
      .subscribe({
        next: () => Swal.fire({
          icon: 'success', title: '¡Gracias!', text: 'Tu opinión nos ayuda a mejorar.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#0da6f3',
        }),
        error: () => Swal.fire({
          icon: 'error', title: 'Error', text: 'No se pudo guardar la reseña.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
        }),
      });
  }

  async confirmarCancelar(c: Cita) {
    const r = await Swal.fire({
      title: '¿Cancelar esta cita?',
      html: `<div style="text-align:left">
        <p><strong>${this.fechaLarga(c.fecha)}</strong> a las <strong>${this.obtenerHora(c.hora)}</strong></p>
        <p style="margin-top:8px;font-size:13px;opacity:.7">Esta acción no se puede deshacer.</p>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Conservar',
      confirmButtonColor: '#cb0000',
      cancelButtonColor: '#525252',
      background: '#1a1b15',
      color: '#ffffff',
    });
    if (!r.isConfirmed) return;
    this.api.cancelCita(c.id).subscribe({
      next: () => this.recargar(),
      error: () => Swal.fire({
        icon: 'error', title: 'Error', text: 'No se pudo cancelar.',
        background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
      }),
    });
  }

  // ----- presentación
  obtenerHora(h: string): string { return h.slice(0, 5); }

  obtenerDow(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').toUpperCase();
  }
  obtenerDia(iso: string): string {
    return String(new Date(iso + 'T12:00:00').getDate());
  }
  obtenerMes(iso: string): string {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' })
      .replace('.', '').toUpperCase();
  }

  private fechaLarga(iso: string): string {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX',
      { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /** "en 3 días" / "hoy" / "hace 2 días" */
  frasePosicion(iso: string): string {
    const ms = new Date(iso + 'T12:00:00').getTime() - new Date(this.hoyISO + 'T12:00:00').getTime();
    const dias = Math.round(ms / 86400000);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    if (dias === -1) return 'Ayer';
    if (dias > 1)  return `En ${dias} días`;
    return `Hace ${Math.abs(dias)} días`;
  }

  badgeClass(estado: string): string {
    return `badge badge-${estado}`;
  }
  etiquetaEstado(e: string): string {
    return { pendiente:'Pendiente', confirmada:'Confirmada', completada:'Completada', cancelada:'Cancelada' }[e] ?? e;
  }
}
