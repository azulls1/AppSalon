import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Servicio } from '../../core/models/servicio';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

type Filtro = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-servicios-list',
  imports: [RouterLink, FormsModule, CurrencyPipe, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Servicios</h1>
    <p class="text-app-blanco/60 mb-4">Catálogo de servicios del salón</p>
    <app-barra-nav />

    <!-- KPIs -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <p class="kpi-label">Total</p>
          <p class="kpi-value">{{ servicios().length }}</p>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12l4 4 10-10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="kpi-label">Activos</p>
          <p class="kpi-value">{{ totalActivos() }}</p>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="kpi-label">Precio Promedio</p>
          <p class="kpi-value">{{ precioPromedio() | currency:'MXN' }}</p>
        </div>
      </div>
    </section>

    <!-- Search + filter -->
    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-blanco/40"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"/>
          <path d="M21 21l-4.3-4.3" stroke-linecap="round"/>
        </svg>
        <input type="text" [(ngModel)]="busqueda" placeholder="Buscar servicio..."
               class="input pl-10" />
      </div>
      <div class="flex gap-1 p-1 rounded-md bg-white/5 border border-white/15">
        @for (f of filtros; track f.value) {
          <button (click)="filtro.set(f.value)"
                  [class]="filtro() === f.value ? 'pill pill-active' : 'pill'">
            {{ f.label }}
          </button>
        }
      </div>
    </div>

    <!-- List / empty -->
    @if (visibles().length === 0) {
      <div class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="11" cy="11" r="7"/>
          <path d="M21 21l-4.3-4.3" stroke-linecap="round"/>
        </svg>
        <p class="text-lg font-bold text-app-blanco mt-3">Sin resultados</p>
        <p class="text-sm text-app-blanco/60 mt-1">
          @if (servicios().length === 0) {
            Aún no hay servicios registrados. Crea el primero.
          } @else {
            Ningún servicio coincide con tu búsqueda.
          }
        </p>
      </div>
    } @else {
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (s of visibles(); track s.id) {
          <li class="srv-card" [class.srv-inactivo]="!s.activo">
            <div class="srv-body">
              <div class="flex items-start justify-between gap-2">
                <p class="font-bold text-app-blanco text-lg leading-tight">{{ s.nombre }}</p>
                <span [class]="s.activo ? 'badge badge-on' : 'badge badge-off'">
                  {{ s.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="flex items-end justify-between mt-2">
                <p class="text-2xl font-black text-app-azul">{{ +s.precio | currency:'MXN' }}</p>
                <p class="text-xs text-app-blanco/60 font-bold flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ s.duracion_min }} min
                </p>
              </div>
            </div>
            <div class="srv-actions">
              <a [routerLink]="['/servicios/editar', s.id]" class="icon-btn icon-btn-edit" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 20h4l10-10-4-4L4 16v4z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 6l4 4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Editar</span>
              </a>
              <button (click)="eliminar(s)" class="icon-btn icon-btn-del" title="Borrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Borrar</span>
              </button>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full h-11 rounded-md bg-white/5 border border-white/15 text-app-blanco px-4
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }

    .kpi { @apply rounded-lg bg-white/5 border border-white/15 p-4 flex items-center gap-3; }
    .kpi-icon {
      @apply w-12 h-12 shrink-0 rounded-md bg-app-azul/15 text-app-azul flex items-center justify-center;
    }
    .kpi-icon svg { @apply w-6 h-6; }
    .kpi-label { @apply text-xs uppercase tracking-wide text-app-blanco/60 font-bold; }
    .kpi-value { @apply text-2xl font-black text-app-blanco; }

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

    .srv-card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             flex flex-col transition-all hover:border-app-azul/50 hover:bg-white/[0.07];
    }
    .srv-inactivo { @apply opacity-60; }
    .srv-body { @apply p-4 flex-1; }
    .srv-actions {
      @apply flex border-t border-white/10 divide-x divide-white/10;
    }
    .icon-btn {
      @apply flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold
             uppercase tracking-wide transition-colors;
    }
    .icon-btn svg { @apply w-4 h-4; }
    .icon-btn-edit {
      @apply text-app-azul hover:bg-app-azul/10;
    }
    .icon-btn-del {
      @apply text-app-rojo hover:bg-app-rojo/10;
    }

    .badge {
      @apply text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full shrink-0;
    }
    .badge-on  { @apply bg-app-verde/20 text-app-verde border border-app-verde/40; }
    .badge-off { @apply bg-app-blanco/10 text-app-blanco/50 border border-app-blanco/20; }
  `],
})
export class ServiciosListComponent {
  private api = inject(ApiService);

  servicios = signal<Servicio[]>([]);
  busqueda = '';
  filtro = signal<Filtro>('todos');

  readonly filtros: { value: Filtro; label: string }[] = [
    { value: 'todos',     label: 'Todos'     },
    { value: 'activos',   label: 'Activos'   },
    { value: 'inactivos', label: 'Inactivos' },
  ];

  totalActivos = computed(() => this.servicios().filter(s => s.activo).length);

  precioPromedio = computed(() => {
    const ss = this.servicios();
    if (ss.length === 0) return 0;
    return ss.reduce((acc, s) => acc + Number(s.precio), 0) / ss.length;
  });

  visibles = computed(() => {
    const term = this.busqueda.trim().toLowerCase();
    const f = this.filtro();
    return this.servicios().filter(s => {
      if (f === 'activos'   && !s.activo) return false;
      if (f === 'inactivos' &&  s.activo) return false;
      if (term && !s.nombre.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  constructor() { this.recargar(); }

  recargar() {
    this.api.listServicios().subscribe(s => this.servicios.set(s));
  }

  async eliminar(s: Servicio) {
    const r = await Swal.fire({
      title: '¿Borrar servicio?',
      text: `"${s.nombre}" se eliminará del catálogo. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#cb0000',
      cancelButtonColor: '#525252',
      background: '#1a1b15',
      color: '#ffffff',
    });
    if (!r.isConfirmed) return;
    this.api.deleteServicio(s.id).subscribe(() => this.recargar());
  }
}
