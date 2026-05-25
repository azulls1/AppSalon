import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Galeria } from '../../core/models/galeria';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

@Component({
  selector: 'app-galeria-list',
  imports: [RouterLink, FormsModule, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Galería Antes / Después</h1>
    <p class="text-app-blanco/60 mb-4">Portfolio visible en la página pública</p>
    <app-barra-nav />

    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <input type="text" [(ngModel)]="busqueda" placeholder="Buscar título..." class="search" />
      <a routerLink="/admin/galeria/crear" class="btn-primary shrink-0">+ Nuevo</a>
    </div>

    @if (cargando()) {
      <p class="text-app-blanco/60">Cargando galería...</p>
    } @else if (visibles().length === 0) {
      <div class="empty">
        <p class="text-lg font-bold text-app-blanco">La galería está vacía</p>
        <p class="text-sm text-app-blanco/60 mt-1">Sube el primer "antes y después" para impulsar conversiones.</p>
        <a routerLink="/admin/galeria/crear" class="mt-4 btn-primary inline-block">Crear Primer Item</a>
      </div>
    } @else {
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (g of visibles(); track g.id) {
          <li class="card" [class.inactivo]="!g.activa">
            <div class="duo">
              <div class="duo-side">
                <img [src]="g.foto_antes_url" [alt]="'Antes ' + g.titulo" />
                <span class="duo-label">Antes</span>
              </div>
              <div class="duo-side">
                <img [src]="g.foto_despues_url" [alt]="'Después ' + g.titulo" />
                <span class="duo-label">Después</span>
              </div>
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <p class="font-bold text-app-blanco">{{ g.titulo }}</p>
                <span [class]="g.activa ? 'badge badge-on' : 'badge badge-off'">
                  {{ g.activa ? 'Visible' : 'Oculto' }}
                </span>
              </div>
              @if (g.descripcion) {
                <p class="text-sm text-app-blanco/60 mt-1">{{ g.descripcion }}</p>
              }
              <div class="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <a [routerLink]="['/admin/galeria/editar', g.id]" class="action-edit">Editar</a>
                <button (click)="eliminar(g)" class="action-del">Borrar</button>
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
    .search {
      @apply h-11 flex-1 rounded-md bg-white/5 border border-white/15 text-app-blanco px-4
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }
    .empty {
      @apply flex flex-col items-center justify-center text-center py-16 px-6
             rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden;
    }
    .card.inactivo { @apply opacity-60; }
    .duo { @apply grid grid-cols-2; }
    .duo-side { @apply relative; }
    .duo-side img { @apply w-full h-48 object-cover bg-white/10; }
    .duo-side:first-child img { @apply border-r border-white/10; }
    .duo-label {
      @apply absolute top-2 left-2 text-[10px] uppercase tracking-wide font-bold
             px-2 py-0.5 rounded bg-app-negro/70 text-app-blanco;
    }
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
export class GaleriaListComponent {
  private api = inject(ApiService);
  items = signal<Galeria[]>([]);
  cargando = signal(true);
  busqueda = '';

  visibles = computed(() => {
    const t = this.busqueda.trim().toLowerCase();
    if (!t) return this.items();
    return this.items().filter(g =>
      g.titulo.toLowerCase().includes(t) ||
      (g.descripcion ?? '').toLowerCase().includes(t)
    );
  });

  constructor() { this.recargar(); }
  recargar() {
    this.cargando.set(true);
    this.api.listGaleria().subscribe({
      next: g => { this.items.set(g); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
  async eliminar(g: Galeria) {
    const r = await Swal.fire({
      title: '¿Borrar item de galería?', text: `"${g.titulo}" se eliminará.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#cb0000', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!r.isConfirmed) return;
    this.api.deleteGaleria(g.id).subscribe(() => this.recargar());
  }
}
