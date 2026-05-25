import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Recompensa } from '../../core/models/recompensa';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

@Component({
  selector: 'app-recompensas-list',
  imports: [RouterLink, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Recompensas</h1>
    <p class="text-app-blanco/60 mb-4">Catálogo de premios canjeables por puntos</p>
    <app-barra-nav />

    <div class="flex justify-end mb-4">
      <a routerLink="/admin/recompensas/crear" class="btn-primary">+ Nueva Recompensa</a>
    </div>

    @if (cargando()) {
      <p class="text-app-blanco/60">Cargando...</p>
    } @else if (items().length === 0) {
      <div class="empty">
        <p class="text-lg font-bold text-app-blanco">Sin recompensas</p>
        <a routerLink="/admin/recompensas/crear" class="mt-4 btn-primary inline-block">Crear Primera</a>
      </div>
    } @else {
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (r of items(); track r.id) {
          <li class="card" [class.inactiva]="!r.activa">
            <img [src]="r.foto_url || 'https://picsum.photos/seed/r/200/200'" alt="" class="card-img" />
            <div class="card-body">
              <div class="flex items-start justify-between gap-2">
                <p class="font-bold text-app-blanco truncate">{{ r.nombre }}</p>
                <span [class]="r.activa ? 'badge badge-on' : 'badge badge-off'">
                  {{ r.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <p class="text-amber-400 font-black mt-1">{{ r.puntos_costo }} pts</p>
              @if (r.stock !== null) {
                <p class="text-xs text-app-blanco/60 mt-0.5">{{ r.stock }} en stock</p>
              }
              <div class="actions">
                <a [routerLink]="['/admin/recompensas/editar', r.id]" class="action-edit">Editar</a>
                <button (click)="eliminar(r)" class="action-del">Borrar</button>
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
      @apply h-11 px-5 rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco
             text-sm font-bold uppercase tracking-wide transition-colors;
    }
    .empty {
      @apply flex flex-col items-center justify-center text-center py-16 px-6
             rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden flex;
    }
    .card.inactiva { @apply opacity-60; }
    .card-img { @apply w-28 h-28 object-cover bg-white/10 shrink-0; }
    .card-body { @apply flex-1 p-3 min-w-0 flex flex-col; }
    .actions { @apply mt-auto pt-2 flex gap-2; }
    .action-edit {
      @apply flex-1 text-center px-2 py-1.5 text-xs font-bold uppercase tracking-wide rounded
             bg-app-azul hover:bg-app-azul-hover text-app-blanco transition-colors;
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
  `],
})
export class RecompensasListComponent {
  private api = inject(ApiService);
  items = signal<Recompensa[]>([]);
  cargando = signal(true);

  constructor() { this.recargar(); }
  recargar() {
    this.cargando.set(true);
    this.api.listRecompensas().subscribe({
      next: r => { this.items.set(r); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
  async eliminar(r: Recompensa) {
    const c = await Swal.fire({
      title: '¿Borrar recompensa?', text: `"${r.nombre}" desaparecerá del catálogo.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#cb0000', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!c.isConfirmed) return;
    this.api.deleteRecompensa(r.id).subscribe(() => this.recargar());
  }
}
