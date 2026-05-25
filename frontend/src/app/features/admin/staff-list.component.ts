import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Staff } from '../../core/models/staff';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

@Component({
  selector: 'app-staff-list',
  imports: [RouterLink, FormsModule, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Estilistas</h1>
    <p class="text-app-blanco/60 mb-4">Gestiona al equipo del salón</p>
    <app-barra-nav />

    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <input type="text" [(ngModel)]="busqueda" placeholder="Buscar estilista..." class="search" />
      <a routerLink="/admin/staff/crear" class="btn-primary shrink-0">+ Nuevo</a>
    </div>

    @if (cargando()) {
      <p class="text-app-blanco/60">Cargando equipo...</p>
    } @else if (visibles().length === 0) {
      <div class="empty">
        <p class="text-lg font-bold text-app-blanco">Aún no hay estilistas</p>
        <p class="text-sm text-app-blanco/60 mt-1">Agrega al primero para que los clientes puedan reservar con él.</p>
        <a routerLink="/admin/staff/crear" class="mt-4 btn-primary inline-block">Agregar Estilista</a>
      </div>
    } @else {
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (m of visibles(); track m.id) {
          <li class="card" [class.inactivo]="!m.activo">
            <img [src]="m.foto_url" [alt]="m.nombre" class="card-img" />
            <div class="card-body">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-bold text-app-blanco truncate">{{ m.nombre }} {{ m.apellido }}</p>
                  <p class="text-sm text-app-azul mt-0.5 truncate">{{ m.especialidad }}</p>
                </div>
                <span [class]="m.activo ? 'badge badge-on' : 'badge badge-off'">
                  {{ m.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              @if (m.rating_promedio) {
                <p class="text-xs text-amber-400 mt-2">
                  ★ {{ m.rating_promedio.toFixed(1) }}
                  <span class="text-app-blanco/40">({{ m.total_resenas }} reseñas)</span>
                </p>
              }
              <div class="actions">
                <a [routerLink]="['/admin/staff/editar', m.id]" class="action-edit">Editar</a>
                <button (click)="eliminar(m)" class="action-del">Borrar</button>
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
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             flex transition-all hover:border-app-azul/40;
    }
    .card.inactivo { @apply opacity-60; }
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
export class StaffListComponent {
  private api = inject(ApiService);
  staff = signal<Staff[]>([]);
  cargando = signal(true);
  busqueda = '';

  visibles = computed(() => {
    const t = this.busqueda.trim().toLowerCase();
    if (!t) return this.staff();
    return this.staff().filter(s =>
      s.nombre.toLowerCase().includes(t) ||
      s.apellido.toLowerCase().includes(t) ||
      s.especialidad.toLowerCase().includes(t)
    );
  });

  constructor() { this.recargar(); }

  recargar() {
    this.cargando.set(true);
    this.api.listStaff().subscribe({
      next: s => { this.staff.set(s); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  async eliminar(m: Staff) {
    const r = await Swal.fire({
      title: '¿Borrar estilista?',
      text: `"${m.nombre} ${m.apellido}" se eliminará. Las citas asociadas quedarán sin estilista asignado.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#cb0000', cancelButtonColor: '#525252',
      background: '#1a1b15', color: '#ffffff',
    });
    if (!r.isConfirmed) return;
    this.api.deleteStaff(m.id).subscribe(() => this.recargar());
  }
}
