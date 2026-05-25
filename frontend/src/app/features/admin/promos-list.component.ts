import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Promo } from '../../core/models/promo';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

@Component({
  selector: 'app-promos-list',
  imports: [RouterLink, CurrencyPipe, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Promociones</h1>
    <p class="text-app-blanco/60 mb-4">Descuentos y promos para clientes registrados</p>
    <app-barra-nav />

    <div class="flex justify-end mb-4">
      <a routerLink="/admin/promos/crear" class="btn-primary">+ Nueva Promoción</a>
    </div>

    @if (cargando()) {
      <p class="text-app-blanco/60">Cargando...</p>
    } @else if (items().length === 0) {
      <div class="empty">
        <p class="text-lg font-bold text-app-blanco">Sin promociones</p>
        <p class="text-sm text-app-blanco/60 mt-1">Crea la primera para que tus clientes registrados la vean.</p>
        <a routerLink="/admin/promos/crear" class="mt-4 btn-primary inline-block">Crear Primera</a>
      </div>
    } @else {
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (p of items(); track p.id) {
          <li class="card" [class.inactiva]="!p.activa">
            @if (p.imagen_url) {
              <img [src]="p.imagen_url" alt="" class="card-img" />
            } @else {
              <div class="card-img flex items-center justify-center text-app-oro text-3xl">★</div>
            }
            <div class="card-body">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-bold text-app-blanco truncate">{{ p.titulo }}</p>
                  @if (p.destacada) { <span class="badge-dest">Destacada</span> }
                </div>
                <span [class]="p.activa ? 'badge badge-on' : 'badge badge-off'">
                  {{ p.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <p class="valor mt-1">{{ formatoValor(p) }}</p>
              <p class="text-xs text-app-blanco/60 mt-0.5">
                @if (p.min_visitas > 0) { · ≥{{ p.min_visitas }} visitas }
                @if (p.min_puntos > 0) { · ≥{{ p.min_puntos }} pts }
                @if (p.vigencia_fin) { · hasta {{ p.vigencia_fin }} }
              </p>
              <div class="actions">
                <a [routerLink]="['/admin/promos/editar', p.id]" class="action-edit">Editar</a>
                <button (click)="eliminar(p)" class="action-del">Borrar</button>
              </div>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    @reference "../../../styles.css";
    .btn-primary {
      @apply h-11 px-5 rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro
             text-sm font-bold uppercase tracking-wide transition-colors;
    }
    .empty {
      @apply flex flex-col items-center justify-center text-center py-16 px-6
             rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .card { @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden flex; }
    .card.inactiva { @apply opacity-60; }
    .card-img { @apply w-28 h-28 object-cover bg-white/10 shrink-0; }
    .card-body { @apply flex-1 p-3 min-w-0 flex flex-col; }
    .valor { @apply text-app-oro font-black text-lg leading-tight; }
    .actions { @apply mt-auto pt-2 flex gap-2; }
    .action-edit {
      @apply flex-1 text-center px-2 py-1.5 text-xs font-bold uppercase tracking-wide rounded
             bg-app-oro hover:bg-app-oro-hover text-app-negro transition-colors;
    }
    .action-del {
      @apply flex-1 px-2 py-1.5 text-xs font-bold uppercase tracking-wide rounded
             bg-app-rojo/15 hover:bg-app-rojo/25 text-app-rojo transition-colors;
    }
    .badge {
      @apply text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full shrink-0;
    }
    .badge-on  { @apply bg-app-verde/20 text-app-verde border border-app-verde/40; }
    .badge-off { @apply bg-app-blanco/10 text-app-blanco/50 border border-app-blanco/20; }
    .badge-dest {
      @apply text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full
             bg-app-oro/20 text-app-oro border border-app-oro/40 inline-block mt-0.5;
    }
  `],
})
export class PromosListComponent {
  private api = inject(ApiService);
  items = signal<Promo[]>([]);
  cargando = signal(true);

  constructor() { this.recargar(); }

  recargar() {
    this.cargando.set(true);
    this.api.listPromosAdmin().subscribe({
      next: r => { this.items.set(r); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  formatoValor(p: Promo): string {
    const valor = Number(p.valor) || 0;
    switch (p.tipo) {
      case 'descuento_pct':   return `${valor}% de descuento`;
      case 'descuento_fijo':  return `$${valor} MXN de descuento`;
      case 'servicio_gratis': return 'Servicio gratis';
      case 'producto_gratis': return 'Producto gratis';
      default: return '';
    }
  }

  async eliminar(p: Promo) {
    const c = await Swal.fire({
      title: '¿Borrar promoción?', text: `"${p.titulo}" desaparecerá.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#cb0000', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!c.isConfirmed) return;
    this.api.deletePromo(p.id).subscribe(() => this.recargar());
  }
}
