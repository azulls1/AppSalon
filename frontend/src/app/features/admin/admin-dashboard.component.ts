import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CitaAdmin } from '../../core/models/cita';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, CurrencyPipe, DatePipe, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Panel de Administración</h1>
    <p class="text-app-blanco/60 mb-4">Resumen del día seleccionado</p>
    <app-barra-nav />

    <!-- KPIs -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" stroke-linecap="round" />
          </svg>
        </div>
        <div>
          <p class="kpi-label">Citas del Día</p>
          <p class="kpi-value">{{ citas().length }}</p>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div>
          <p class="kpi-label">Ingreso Esperado</p>
          <p class="kpi-value">{{ ingresoTotal() | currency:'MXN' }}</p>
        </div>
      </div>

      <div class="kpi">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div>
          <p class="kpi-label">Próxima Cita</p>
          @if (proximaCita(); as p) {
            <p class="kpi-value text-2xl">{{ formatHora(p.hora) }}</p>
            <p class="text-sm text-app-blanco/60 truncate">{{ p.cliente_nombre }} {{ p.cliente_apellido }}</p>
          } @else {
            <p class="kpi-value text-2xl text-app-blanco/30">—</p>
          }
        </div>
      </div>
    </section>

    <!-- Day navigator -->
    <div class="flex items-center gap-2 mb-2">
      <button (click)="cambiarDia(-1)" class="btn-nav" title="Día anterior">‹</button>
      <input type="date" class="input flex-1" [(ngModel)]="fecha" (change)="buscar()" />
      <button (click)="cambiarDia(1)" class="btn-nav" title="Día siguiente">›</button>
      <button (click)="hoy()" class="btn-hoy">Hoy</button>
    </div>
    <p class="text-app-blanco/60 text-sm capitalize mb-6">
      {{ fechaDate() | date:'fullDate':'':'es-MX' }}
    </p>

    <!-- Citas list / empty state -->
    @if (citas().length === 0) {
      <div class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" stroke-linecap="round" />
          <path d="M8 16h2M14 16h2" stroke-linecap="round" />
        </svg>
        <p class="text-lg font-bold text-app-blanco mt-3">No hay citas en esta fecha</p>
        <p class="text-sm text-app-blanco/60 mt-1">Cuando un cliente reserve, aparecerá aquí.</p>
      </div>
    } @else {
      <ul class="space-y-4">
        @for (c of citas(); track c.id) {
          <li class="cita-card">
            <div class="cita-hora">
              <span class="cita-hora-grande">{{ formatHora(c.hora) }}</span>
              <span class="cita-estado-badge">{{ c.estado }}</span>
            </div>
            <div class="cita-body">
              <div>
                <p class="font-bold text-app-blanco text-lg leading-tight">
                  {{ c.cliente_nombre }} {{ c.cliente_apellido }}
                </p>
                <p class="text-sm text-app-blanco/60 mt-0.5 truncate">
                  {{ c.cliente_email ?? '—' }} · {{ c.cliente_telefono ?? '—' }}
                </p>
                @if (c.staff_nombre) {
                  <p class="text-xs text-app-blanco/70 mt-1">Con <span class="font-bold text-app-blanco">{{ c.staff_nombre }}</span></p>
                }
              </div>
              <div class="cita-servicios">
                @for (s of c.servicios; track s.servicio_id) {
                  <span class="chip">{{ s.nombre }}</span>
                }
              </div>
              <div class="cita-total">
                <span class="text-app-blanco/70 text-sm uppercase tracking-wide font-bold">Total</span>
                <span class="text-app-azul font-black text-xl">{{ +c.total | currency:'MXN' }}</span>
              </div>
              @if (c.estado !== 'completada') {
                <button (click)="completar(c)" class="btn-completar w-full mt-2">
                  Marcar Completada · +{{ puntosEstimados(+c.total) }} pts
                </button>
              } @else {
                <p class="text-xs text-app-verde font-bold uppercase tracking-wide text-center mt-2">
                  ✓ Completada
                </p>
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full h-12 rounded-md bg-white/5 border border-white/15 text-app-blanco px-4
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
      color-scheme: dark;
    }
    .kpi {
      @apply rounded-lg bg-white/5 border border-white/15 p-4 flex items-center gap-3;
    }
    .kpi-icon {
      @apply w-12 h-12 shrink-0 rounded-md bg-app-azul/15 text-app-azul flex items-center justify-center;
    }
    .kpi-icon svg { @apply w-6 h-6; }
    .kpi-label { @apply text-xs uppercase tracking-wide text-app-blanco/60 font-bold; }
    .kpi-value { @apply text-3xl font-black text-app-blanco; }

    .btn-nav {
      @apply w-12 h-12 shrink-0 rounded-md bg-white/10 hover:bg-white/15 text-app-blanco
             text-2xl font-bold flex items-center justify-center transition-colors;
    }
    .btn-hoy {
      @apply px-4 h-12 shrink-0 rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco
             text-sm font-bold uppercase tracking-wide transition-colors;
    }

    .empty {
      @apply flex flex-col items-center justify-center text-center py-16 px-6
             rounded-lg bg-white/5 border border-dashed border-white/15;
    }
    .empty-icon { @apply w-20 h-20 text-app-blanco/25; }

    .cita-card {
      @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden
             flex flex-col sm:flex-row;
    }
    .cita-hora {
      @apply bg-app-azul/15 border-b sm:border-b-0 sm:border-r border-white/10 p-4 sm:w-32
             flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0.5;
    }
    .cita-hora-grande { @apply text-3xl font-black text-app-azul leading-none; }
    .cita-estado-badge {
      @apply text-[10px] uppercase tracking-wide font-bold text-app-blanco/70
             rounded-full px-2 py-0.5 bg-white/10;
    }
    .cita-body { @apply flex-1 p-4 space-y-3 min-w-0; }
    .cita-servicios { @apply flex flex-wrap gap-1.5; }
    .chip {
      @apply text-xs px-2.5 py-1 rounded-full bg-app-azul/15 border border-app-azul/30
             text-app-azul font-bold;
    }
    .cita-total {
      @apply flex items-center justify-between border-t border-white/10 pt-3;
    }
    .btn-completar {
      @apply px-3 py-2 text-xs font-bold uppercase tracking-wide rounded
             bg-app-verde/15 hover:bg-app-verde/25 text-app-verde transition-colors;
    }
  `],
})
export class AdminDashboardComponent {
  private api = inject(ApiService);

  fecha = new Date().toISOString().slice(0, 10);
  citas = signal<CitaAdmin[]>([]);

  ingresoTotal = computed(() =>
    this.citas().reduce((acc, c) => acc + Number(c.total), 0),
  );

  proximaCita = computed<CitaAdmin | null>(() => {
    const list = this.citas();
    if (list.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...list].sort((a, b) => a.hora.localeCompare(b.hora));
    if (this.fecha === today) {
      const horaActual = new Date().toTimeString().slice(0, 8);
      return sorted.find(c => c.hora >= horaActual) ?? null;
    }
    return sorted[0] ?? null;
  });

  fechaDate = computed(() => new Date(this.fecha + 'T12:00:00'));

  constructor() { this.buscar(); }

  buscar() {
    this.api.adminCitasByDate(this.fecha).subscribe(c => this.citas.set(c));
  }

  puntosEstimados(total: number): number {
    return Math.ceil(total / 100);
  }

  completar(c: CitaAdmin) {
    this.api.completarCita(c.id).subscribe({
      next: r => Swal.fire({
        icon: 'success', title: '¡Cita completada!',
        text: `Se otorgaron ${r.puntos_otorgados} puntos al cliente.`,
        background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#0da6f3',
        timer: 1800, showConfirmButton: false,
      }).then(() => this.buscar()),
      error: (e) => Swal.fire({
        icon: 'error', title: 'Error',
        text: e?.error?.detail ?? 'No se pudo completar.',
        background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
      }),
    });
  }

  cambiarDia(delta: number) {
    const d = new Date(this.fecha + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    this.fecha = d.toISOString().slice(0, 10);
    this.buscar();
  }

  hoy() {
    this.fecha = new Date().toISOString().slice(0, 10);
    this.buscar();
  }

  formatHora(hora: string): string {
    return hora.slice(0, 5);
  }
}
