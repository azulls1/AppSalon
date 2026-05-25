import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Servicio } from '../../core/models/servicio';
import { Staff } from '../../core/models/staff';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';

const BOOKING_STATE_KEY = 'appsalon.bookingState.v1';

interface BookingState {
  paso: number;
  pasoMax: number;
  seleccionados: string[];
  staffId: string | null | undefined;
  fecha: string;
  hora: string;
  notas: string;
}

const SLOT_MIN_INICIO = '10:00';
const SLOT_MIN_FIN = '17:30';
const SLOT_INTERVALO_MIN = 30;

@Component({
  selector: 'app-booking',
  imports: [FormsModule, RouterLink, CurrencyPipe, BarraNavComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">Reservar Cita</h1>
    <p class="text-app-blanco/60 mb-4">Tu próxima visita en 4 pasos</p>
    @if (isAuthed()) {
      <app-barra-nav />
    } @else {
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4 mb-6">
        <p class="text-sm text-app-blanco/70">
          Estás explorando como invitado. Te pediremos la cuenta al confirmar.
        </p>
        <a routerLink="/login" [queryParams]="{ returnUrl: '/cita' }"
           class="px-4 py-2 text-sm rounded bg-app-oro text-app-negro font-bold uppercase tracking-wide hover:bg-app-oro-hover">
          Iniciar sesión
        </a>
      </div>
    }

    <!-- Stepper -->
    <nav class="stepper">
      @for (s of pasos; track s.n) {
        <button (click)="irPaso(s.n)" [disabled]="s.n > pasoMax()"
                [class]="stepClass(s.n)">
          <span class="step-num">{{ s.n }}</span>
          <span class="step-label">{{ s.label }}</span>
        </button>
        @if (s.n < pasos.length) {
          <span class="step-divider" [class.done]="paso() > s.n"></span>
        }
      }
    </nav>

    <!-- Paso 1: Servicios -->
    @if (paso() === 1) {
      <section>
        <h2 class="seccion-titulo">¿Qué te haremos?</h2>
        <p class="seccion-sub">Selecciona uno o más servicios</p>

        @if (cargandoServicios()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (i of [1,2,3,4]; track i) { <div class="srv-skel"></div> }
          </div>
        } @else if (servicios().length === 0) {
          <p class="text-app-blanco/60 text-center py-8">No hay servicios disponibles.</p>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (s of servicios(); track s.id) {
              <button type="button" (click)="toggleServicio(s)"
                      [class.activo]="seleccionados().has(s.id)"
                      class="srv-card">
                <div class="srv-head">
                  <p class="srv-nombre">{{ s.nombre }}</p>
                  <span class="srv-check">
                    @if (seleccionados().has(s.id)) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    }
                  </span>
                </div>
                <div class="srv-meta">
                  <span class="srv-precio">{{ +s.precio | currency:'MXN' }}</span>
                  <span class="srv-dur">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ s.duracion_min }} min
                  </span>
                </div>
              </button>
            }
          </div>
        }
      </section>
    }

    <!-- Paso 2: Barbero / Estilista -->
    @if (paso() === 2) {
      <section>
        <h2 class="seccion-titulo">¿Con quién quieres tu cita?</h2>
        <p class="seccion-sub">Elige tu profesional preferido o deja que asignemos al disponible</p>

        @if (cargandoStaff()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (i of [1,2,3]; track i) { <div class="staff-skel"></div> }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- "Cualquier disponible" -->
            <button type="button" (click)="seleccionarStaff(null)"
                    [class.staff-sel]="staffId() === null"
                    class="staff-card staff-cualquier">
              <div class="staff-avatar-any">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>
                  <circle cx="10" cy="7" r="4"/>
                  <path d="M21 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="text-left flex-1">
                <p class="staff-nombre">Cualquier disponible</p>
                <p class="staff-esp">El primero que se libere en tu horario</p>
              </div>
              <span class="staff-check">
                @if (staffId() === null) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              </span>
            </button>

            @for (m of staff(); track m.id) {
              <button type="button" (click)="seleccionarStaff(m.id)"
                      [class.staff-sel]="staffId() === m.id"
                      class="staff-card">
                <img [src]="m.foto_url" [alt]="m.nombre" class="staff-avatar" />
                <div class="text-left flex-1 min-w-0">
                  <p class="staff-nombre">{{ m.nombre }} {{ m.apellido }}</p>
                  <p class="staff-esp">{{ m.especialidad }}</p>
                  @if (m.rating_promedio) {
                    <p class="text-xs text-amber-400 mt-1">
                      ★ {{ m.rating_promedio.toFixed(1) }}
                      <span class="text-app-blanco/40">({{ m.total_resenas }})</span>
                    </p>
                  }
                </div>
                <span class="staff-check">
                  @if (staffId() === m.id) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </span>
              </button>
            }
          </div>
        }
      </section>
    }

    <!-- Paso 3: Fecha y hora -->
    @if (paso() === 3) {
      <section>
        <h2 class="seccion-titulo">¿Cuándo te acomoda?</h2>
        <p class="seccion-sub">Elige fecha y hora disponibles</p>

        <!-- FECHA -->
        <div class="flex items-baseline justify-between mt-4 mb-3">
          <p class="text-xs uppercase tracking-[0.2em] font-bold text-app-oro">Fecha</p>
          @if (fecha()) {
            <p class="text-xs text-app-blanco/60 capitalize">{{ fechaLarga() }}</p>
          }
        </div>
        <div class="fechas-strip">
          @for (d of diasDisponibles; track d.iso) {
            <button (click)="seleccionarFecha(d.iso)"
                    [class.fecha-sel]="fecha() === d.iso"
                    [class.fecha-hoy]="d.relativo === 'hoy'"
                    class="fecha-chip">
              @if (d.relativo) {
                <span class="fecha-badge">{{ d.relativo }}</span>
              } @else {
                <span class="fecha-dow">{{ d.dow }}</span>
              }
              <span class="fecha-num">{{ d.num }}</span>
              <span class="fecha-mon">{{ d.mon }}</span>
            </button>
          }
        </div>

        <!-- HORA -->
        <div class="flex items-baseline justify-between mt-8 mb-3">
          <p class="text-xs uppercase tracking-[0.2em] font-bold text-app-oro">
            Hora
            @if (duracionTotal() > 0) {
              <span class="text-app-blanco/40 normal-case tracking-normal font-normal ml-1">
                · ~{{ duracionTotal() }} min por reserva
              </span>
            }
          </p>
          @if (fecha()) {
            <p class="text-xs text-app-blanco/60">
              @if (cargandoSlots()) {
                <span class="text-app-blanco/40">verificando...</span>
              } @else {
                <span [class.text-app-oro]="slotsLibres() > 3"
                      [class.text-amber-400]="slotsLibres() > 0 && slotsLibres() <= 3"
                      [class.text-app-rojo]="slotsLibres() === 0"
                      class="font-bold">{{ slotsLibres() }}</span>
                de {{ slots.length }} disponibles
              }
            </p>
          }
        </div>

        <!-- Mantenemos la estructura siempre montada para evitar layout shift
             al cambiar de fecha. Mientras carga, atenuamos y bloqueamos. -->
        <div class="slots-wrap" [class.slots-loading]="cargandoSlots()">
          <!-- Mañana -->
          <div class="hora-bloque">
            <p class="hora-bloque-label">
              <span class="hora-bloque-icon">☀️</span> Mañana
              <span class="hora-bloque-rango">10:00 – 12:30</span>
            </p>
            <div class="slots-grid">
              @for (slot of slotsManana; track slot) {
                <button (click)="seleccionarHora(slot)"
                        [disabled]="ocupados().has(slot) || cargandoSlots()"
                        [class.slot-sel]="hora() === slot"
                        [class.slot-ocupado]="ocupados().has(slot)"
                        class="slot">
                  <span class="slot-hora">{{ slot }}</span>
                  @if (duracionTotal() > 0 && !ocupados().has(slot)) {
                    <span class="slot-fin">→ {{ slotFin(slot) }}</span>
                  }
                  @if (hora() === slot) {
                    <svg class="slot-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Tarde -->
          <div class="hora-bloque">
            <p class="hora-bloque-label">
              <span class="hora-bloque-icon">🌇</span> Tarde
              <span class="hora-bloque-rango">13:00 – 17:30</span>
            </p>
            <div class="slots-grid">
              @for (slot of slotsTarde; track slot) {
                <button (click)="seleccionarHora(slot)"
                        [disabled]="ocupados().has(slot) || cargandoSlots()"
                        [class.slot-sel]="hora() === slot"
                        [class.slot-ocupado]="ocupados().has(slot)"
                        class="slot">
                  <span class="slot-hora">{{ slot }}</span>
                  @if (duracionTotal() > 0 && !ocupados().has(slot)) {
                    <span class="slot-fin">→ {{ slotFin(slot) }}</span>
                  }
                  @if (hora() === slot) {
                    <svg class="slot-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        @if (!cargandoSlots() && slotsLibres() === 0 && fecha()) {
          <p class="text-app-rojo text-sm mt-4 font-bold">
            Este día está lleno. Prueba otra fecha de las que están arriba.
          </p>
        }
      </section>
    }

    <!-- Paso 4: Confirmación -->
    @if (paso() === 4) {
      <section>
        <h2 class="seccion-titulo">Confirma tu reserva</h2>
        <p class="seccion-sub">Revisa los detalles antes de guardar</p>

        <div class="resumen">
          <div class="resumen-bloque">
            <div class="flex justify-between items-baseline">
              <h3 class="resumen-h3">Servicios</h3>
              <button (click)="paso.set(1)" class="link-edit">Editar</button>
            </div>
            <ul class="mt-2 space-y-1">
              @for (s of serviciosSeleccionados(); track s.id) {
                <li class="flex justify-between text-sm">
                  <span class="text-app-blanco/80">{{ s.nombre }} <span class="text-app-blanco/50">· {{ s.duracion_min }}m</span></span>
                  <span class="font-bold text-app-blanco">{{ +s.precio | currency:'MXN' }}</span>
                </li>
              }
            </ul>
          </div>

          <div class="resumen-bloque">
            <div class="flex justify-between items-baseline">
              <h3 class="resumen-h3">Profesional</h3>
              <button (click)="paso.set(2)" class="link-edit">Editar</button>
            </div>
            @if (staffSeleccionado(); as m) {
              <div class="flex items-center gap-3 mt-2">
                <img [src]="m.foto_url" [alt]="m.nombre" class="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p class="text-sm font-bold text-app-blanco">{{ m.nombre }} {{ m.apellido }}</p>
                  <p class="text-xs text-app-blanco/60">{{ m.especialidad }}</p>
                </div>
              </div>
            } @else {
              <p class="text-sm text-app-blanco/80 mt-2">Cualquier estilista disponible</p>
            }
          </div>

          <div class="resumen-bloque">
            <div class="flex justify-between items-baseline">
              <h3 class="resumen-h3">Cuándo</h3>
              <button (click)="paso.set(3)" class="link-edit">Editar</button>
            </div>
            <p class="text-sm text-app-blanco/80 mt-1 capitalize">
              {{ fechaLarga() }} · {{ hora() }}
            </p>
            <p class="text-xs text-app-blanco/50 mt-0.5">
              Duración estimada: ~{{ duracionTotal() }} minutos
            </p>
          </div>

          <div class="resumen-bloque">
            <h3 class="resumen-h3">Notas para tu estilista <span class="text-app-blanco/40 font-normal">(opcional)</span></h3>
            <textarea [(ngModel)]="notas" maxlength="280" rows="3"
                      placeholder="Alergias, preferencias, peinado de referencia..."
                      class="notas-input mt-2"></textarea>
            <p class="text-[10px] text-app-blanco/50 text-right">{{ notas.length }} / 280</p>
          </div>

          @if (!isAuthed()) {
            <div class="resumen-bloque">
              <div class="flex items-baseline justify-between gap-2 mb-2">
                <h3 class="resumen-h3">Tus datos</h3>
                <a routerLink="/login" [queryParams]="{ returnUrl: '/cita' }"
                   class="link-edit">Tengo cuenta</a>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input [(ngModel)]="guestNombre" name="g_nombre"
                       maxlength="120" placeholder="Tu nombre"
                       class="notas-input sm:col-span-2" />
                <input [(ngModel)]="guestTelefono" name="g_tel" type="tel"
                       maxlength="20" placeholder="WhatsApp (10 dígitos)"
                       class="notas-input" />
                <input [(ngModel)]="guestEmail" name="g_email" type="email"
                       maxlength="180" placeholder="Email para confirmación"
                       class="notas-input" />
              </div>
              <p class="text-[11px] text-app-blanco/50 mt-2 leading-relaxed">
                Reservas como invitado. <a routerLink="/crear-cuenta"
                   [queryParams]="{ returnUrl: '/cita' }"
                   class="text-app-oro hover:underline">Crea tu cuenta</a> para
                acumular puntos en cada visita y canjear cortes gratis.
              </p>
            </div>
          }

          <div class="resumen-total">
            <span class="text-sm uppercase tracking-wide font-bold text-app-blanco/70">Total</span>
            <span class="text-3xl font-black text-app-oro">{{ total() | currency:'MXN' }}</span>
          </div>

          <div class="politica">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v5M12 17h.01" stroke-linecap="round"/>
            </svg>
            <span>
              @if (isAuthed()) {
                Puedes cancelar tu cita sin costo desde "Mis Citas". Te pedimos avisar con
                al menos 2 horas de anticipación.
              } @else {
                Como invitado no podrás cancelar tu cita desde la app — llámanos
                al 56 3349 3004 con al menos 2 horas de anticipación.
              }
            </span>
          </div>
        </div>
      </section>
    }

    <!-- Footer -->
    <footer class="mt-8 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="text-app-blanco/60 text-sm">
        @if (seleccionados().size > 0) {
          <span class="font-bold text-app-blanco">{{ total() | currency:'MXN' }}</span>
          · {{ seleccionados().size }} servicio{{ seleccionados().size === 1 ? '' : 's' }}
          @if (duracionTotal() > 0) { · ~{{ duracionTotal() }}m }
        }
      </div>
      <div class="flex gap-2">
        <button (click)="anterior()" [disabled]="paso() === 1" class="btn-sec">‹ Anterior</button>
        @if (paso() < 4) {
          <button (click)="siguiente()" [disabled]="!puedeSiguiente()" class="btn-primary">Siguiente ›</button>
        } @else {
          <button (click)="reservar()" [disabled]="!puedeReservar() || guardando()" class="btn-primary">
            {{ guardando() ? 'Guardando...' : 'Confirmar Reserva' }}
          </button>
        }
      </div>
    </footer>
  `,
  styles: [`
    @reference "../../../styles.css";

    .stepper { @apply flex items-center gap-1 mb-8; }
    .step {
      @apply flex items-center gap-2 px-2 py-2 rounded-md text-app-blanco/50
             transition-colors;
    }
    .step:not(:disabled):hover { @apply text-app-blanco bg-white/5; }
    .step.active { @apply text-app-blanco; }
    .step.done { @apply text-app-azul; }
    .step-num {
      @apply w-7 h-7 shrink-0 rounded-full border border-current
             flex items-center justify-center text-xs font-black;
    }
    .step.active .step-num { @apply bg-app-azul border-app-azul text-app-blanco; }
    .step.done .step-num { @apply bg-app-azul/20 border-app-azul text-app-azul; }
    .step-label { @apply text-xs font-bold uppercase tracking-wide hidden sm:inline; }
    .step-divider { @apply flex-1 h-px bg-white/15 max-w-10; }
    .step-divider.done { @apply bg-app-azul/40; }

    .seccion-titulo { @apply text-2xl font-black text-app-blanco mb-1; }
    .seccion-sub    { @apply text-app-blanco/60 mb-6; }

    /* Servicios */
    .srv-card {
      @apply rounded-lg bg-white/5 border-2 border-white/10 p-4 text-left
             transition-all hover:border-app-azul/50 hover:bg-white/[0.07];
    }
    .srv-card.activo { @apply border-app-azul bg-app-azul/10; }
    .srv-head { @apply flex items-start justify-between gap-2; }
    .srv-nombre { @apply font-bold text-app-blanco leading-tight; }
    .srv-check {
      @apply w-6 h-6 shrink-0 rounded-full border-2 border-white/20
             flex items-center justify-center text-app-blanco transition-colors;
    }
    .srv-card.activo .srv-check { @apply bg-app-azul border-app-azul; }
    .srv-check svg { @apply w-4 h-4; }
    .srv-meta { @apply flex items-center justify-between mt-3; }
    .srv-precio { @apply text-xl font-black text-app-azul; }
    .srv-dur {
      @apply text-xs text-app-blanco/60 font-bold inline-flex items-center gap-1;
    }
    .srv-dur svg { @apply w-3.5 h-3.5; }
    .srv-skel { @apply rounded-lg bg-white/5 border border-white/10 h-28 animate-pulse; }

    /* Staff */
    .staff-card {
      @apply rounded-lg bg-white/5 border-2 border-white/10 p-3
             flex items-center gap-3 transition-all
             hover:border-app-azul/50 hover:bg-white/[0.07];
    }
    .staff-card.staff-sel { @apply border-app-azul bg-app-azul/10; }
    .staff-avatar {
      @apply w-14 h-14 rounded-full object-cover bg-white/10 shrink-0;
    }
    .staff-avatar-any {
      @apply w-14 h-14 shrink-0 rounded-full bg-app-azul/15 text-app-azul
             flex items-center justify-center;
    }
    .staff-avatar-any svg { @apply w-7 h-7; }
    .staff-nombre { @apply font-bold text-app-blanco leading-tight; }
    .staff-esp { @apply text-xs text-app-blanco/60 mt-0.5; }
    .staff-check {
      @apply w-6 h-6 shrink-0 rounded-full border-2 border-white/20
             flex items-center justify-center text-app-blanco transition-colors;
    }
    .staff-card.staff-sel .staff-check { @apply bg-app-azul border-app-azul; }
    .staff-check svg { @apply w-4 h-4; }
    .staff-skel { @apply rounded-lg bg-white/5 border border-white/10 h-20 animate-pulse; }

    /* Fechas strip */
    .fechas-strip {
      @apply flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory;
      scrollbar-width: thin;
    }
    .fecha-chip {
      @apply shrink-0 w-[4.5rem] py-2 rounded-md bg-white/5 border border-white/15
             flex flex-col items-center gap-0.5 transition-all snap-start
             hover:border-app-oro/60 hover:bg-white/[0.08]
             relative;
    }
    .fecha-chip.fecha-hoy {
      @apply border-app-oro/60 ring-1 ring-app-oro/20;
    }
    .fecha-chip.fecha-sel {
      @apply bg-app-oro border-app-oro shadow-lg shadow-app-oro/30
             ring-2 ring-app-oro/40;
      transform: translateY(-3px);
    }
    .fecha-badge {
      @apply text-[10px] uppercase tracking-wider font-black text-app-oro;
    }
    .fecha-chip.fecha-sel .fecha-badge { @apply text-app-negro; }
    .fecha-dow { @apply text-[10px] uppercase tracking-wide font-bold text-app-blanco/60; }
    .fecha-chip.fecha-sel .fecha-dow { @apply text-app-negro; }
    .fecha-num { @apply text-2xl font-black text-app-blanco leading-none; }
    .fecha-chip.fecha-sel .fecha-num { @apply text-app-negro; }
    .fecha-mon { @apply text-[10px] uppercase tracking-wide font-bold text-app-blanco/60; }
    .fecha-chip.fecha-sel .fecha-mon { @apply text-app-negro/80; }

    /* Bloques de hora (mañana / tarde) */
    .hora-bloque { @apply mb-5; }
    .hora-bloque-label {
      @apply text-xs uppercase tracking-[0.2em] font-bold text-app-blanco/70
             flex items-center gap-2 mb-3;
    }
    .hora-bloque-icon { @apply text-base; }
    .hora-bloque-rango { @apply ml-auto text-[10px] font-normal text-app-blanco/40; }

    /* Slots */
    .slots-grid { @apply grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2; }
    .slot {
      @apply relative rounded-md bg-white/5 border border-white/15 text-app-blanco
             py-2.5 px-2 text-sm font-bold transition-all
             flex flex-col items-center justify-center gap-0.5
             hover:border-app-oro/60 hover:bg-white/[0.08] hover:-translate-y-0.5;
    }
    .slot-hora { @apply text-sm font-bold leading-none; }
    .slot-fin { @apply text-[10px] text-app-blanco/50 font-normal leading-none; }
    .slot.slot-sel {
      @apply bg-app-oro border-app-oro text-app-negro shadow-lg shadow-app-oro/30;
      transform: scale(1.04);
    }
    .slot.slot-sel .slot-fin { @apply text-app-negro/70; }
    .slot-check {
      @apply absolute top-1 right-1 w-3.5 h-3.5 text-app-negro;
    }
    .slot.slot-ocupado {
      @apply bg-transparent text-app-blanco/30 border-white/10 cursor-not-allowed
             hover:bg-transparent hover:border-white/10 hover:translate-y-0;
      position: relative;
    }
    .slot.slot-ocupado::after {
      content: '';
      position: absolute;
      left: 14%; right: 14%; top: 50%;
      height: 2px;
      background: rgba(255,255,255,0.18);
      transform: translateY(-50%) rotate(-8deg);
    }
    .slot:disabled { @apply cursor-not-allowed; }

    .slot-skel {
      @apply rounded-md bg-white/5 border border-white/10 h-12 animate-pulse;
    }

    /* Wrapper que mantiene el layout fijo entre cargas de disponibilidad.
       Mientras carga, atenuamos sin desmontar — evita el "jump" visual. */
    .slots-wrap {
      transition: opacity 220ms ease;
    }
    .slots-wrap.slots-loading {
      opacity: 0.5;
      pointer-events: none;
    }

    /* Resumen */
    .resumen { @apply rounded-lg bg-white/5 border border-white/15 divide-y divide-white/10; }
    .resumen-bloque { @apply p-4; }
    .resumen-h3 { @apply text-xs uppercase tracking-wide font-bold text-app-blanco/60; }
    .link-edit { @apply text-xs font-bold uppercase tracking-wide text-app-azul hover:underline; }
    .resumen-total {
      @apply p-4 flex items-center justify-between bg-app-azul/5;
    }
    .politica {
      @apply p-4 flex items-start gap-2 text-xs text-app-blanco/60 bg-white/[0.03];
    }
    .politica svg { @apply w-4 h-4 shrink-0 mt-0.5 text-app-azul; }

    .notas-input {
      @apply w-full rounded-md bg-white/5 border border-white/15 text-app-blanco p-3
             text-sm resize-y placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }

    .btn-primary {
      @apply h-11 px-5 rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco
             font-bold uppercase tracking-wide transition-colors
             disabled:opacity-40 disabled:cursor-not-allowed;
    }
    .btn-sec {
      @apply h-11 px-5 rounded-md bg-white/10 hover:bg-white/15 text-app-blanco
             font-bold uppercase tracking-wide transition-colors
             disabled:opacity-30 disabled:cursor-not-allowed;
    }
  `],
})
export class BookingComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private supa = inject(SupabaseService);
  private router = inject(Router);

  readonly isAuthed = this.auth.isAuthenticated;

  paso = signal(1);
  pasoMax = signal(1);

  servicios = signal<Servicio[]>([]);
  cargandoServicios = signal(true);
  seleccionados = signal<Set<string>>(new Set());

  staff = signal<Staff[]>([]);
  cargandoStaff = signal(true);
  staffId = signal<string | null | undefined>(undefined); // undefined = aún no escogió, null = "cualquier"

  fecha = signal<string>('');
  hora = signal<string>('');
  ocupados = signal<Set<string>>(new Set());
  cargandoSlots = signal(false);

  notas = '';
  guestNombre = '';
  guestEmail = '';
  guestTelefono = '';
  guardando = signal(false);

  readonly pasos = [
    { n: 1, label: 'Servicios' },
    { n: 2, label: 'Barbero'   },
    { n: 3, label: 'Hora'      },
    { n: 4, label: 'Confirmar' },
  ];

  readonly slots = this.generarSlots();
  readonly slotsManana = this.slots.filter(s => Number(s.split(':')[0]) < 13);
  readonly slotsTarde  = this.slots.filter(s => Number(s.split(':')[0]) >= 13);
  readonly diasDisponibles = this.generarDias();

  serviciosSeleccionados = computed(() =>
    this.servicios().filter(s => this.seleccionados().has(s.id))
  );
  staffSeleccionado = computed<Staff | null>(() => {
    const id = this.staffId();
    if (!id) return null;
    return this.staff().find(s => s.id === id) ?? null;
  });
  total = computed(() =>
    this.serviciosSeleccionados().reduce((acc, s) => acc + Number(s.precio), 0)
  );
  duracionTotal = computed(() =>
    this.serviciosSeleccionados().reduce((acc, s) => acc + (s.duracion_min || 0), 0)
  );
  slotsLibres = computed(() => this.slots.filter(s => !this.ocupados().has(s)).length);
  fechaLarga = computed(() => {
    if (!this.fecha()) return '';
    return new Date(this.fecha() + 'T12:00:00').toLocaleDateString('es-MX',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  puedeSiguiente = computed(() => {
    if (this.paso() === 1) return this.seleccionados().size > 0;
    if (this.paso() === 2) return this.staffId() !== undefined;
    if (this.paso() === 3) return !!this.fecha() && !!this.hora();
    return false;
  });
  puedeReservar = computed(() =>
    this.seleccionados().size > 0 && this.staffId() !== undefined &&
    !!this.fecha() && !!this.hora()
  );

  constructor() {
    // Cargamos servicios y staff directo desde Supabase con la anon key:
    // /cita es público, así que no podemos depender del backend con Bearer.
    this.cargarServicios();
    this.cargarStaff();

    // Si el usuario eligió todo, se fue a /login y volvió autenticado, restauramos.
    if (this.isAuthed()) this.restoreState();
  }

  private async cargarServicios() {
    const { data, error } = await this.supa.client
      .from('appsalon_servicios')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: false });
    if (!error && data) this.servicios.set(data as Servicio[]);
    this.cargandoServicios.set(false);
  }

  private async cargarStaff() {
    const { data, error } = await this.supa.client
      .from('appsalon_staff')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    if (!error && data) this.staff.set(data as Staff[]);
    this.cargandoStaff.set(false);
  }

  private saveState() {
    const state: BookingState = {
      paso: this.paso(),
      pasoMax: this.pasoMax(),
      seleccionados: Array.from(this.seleccionados()),
      staffId: this.staffId(),
      fecha: this.fecha(),
      hora: this.hora(),
      notas: this.notas,
    };
    try {
      sessionStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(state));
    } catch { /* sessionStorage no disponible: silenciar */ }
  }

  private restoreState() {
    try {
      const raw = sessionStorage.getItem(BOOKING_STATE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as BookingState;
      this.paso.set(s.paso ?? 1);
      this.pasoMax.set(s.pasoMax ?? 1);
      this.seleccionados.set(new Set(s.seleccionados ?? []));
      this.staffId.set(s.staffId);
      this.fecha.set(s.fecha ?? '');
      this.hora.set(s.hora ?? '');
      this.notas = s.notas ?? '';
      sessionStorage.removeItem(BOOKING_STATE_KEY);
      if (this.fecha()) this.cargarDisponibilidad();
    } catch { /* JSON inválido: ignorar */ }
  }

  stepClass(n: number): string {
    if (this.paso() === n) return 'step active';
    if (this.paso() > n) return 'step done';
    return 'step';
  }
  irPaso(n: number) { if (n <= this.pasoMax()) this.paso.set(n); }
  anterior() { if (this.paso() > 1) this.paso.set(this.paso() - 1); }
  siguiente() {
    if (!this.puedeSiguiente()) return;
    const next = this.paso() + 1;
    this.paso.set(next);
    this.pasoMax.set(Math.max(this.pasoMax(), next));
  }

  toggleServicio(s: Servicio) {
    const next = new Set(this.seleccionados());
    if (next.has(s.id)) next.delete(s.id);
    else next.add(s.id);
    this.seleccionados.set(next);
  }

  seleccionarStaff(id: string | null) {
    this.staffId.set(id);
  }

  seleccionarFecha(iso: string) {
    this.fecha.set(iso);
    this.hora.set('');
    this.cargarDisponibilidad();
  }
  seleccionarHora(h: string) {
    if (this.ocupados().has(h)) return;
    this.hora.set(h);
  }

  private cargarDisponibilidad() {
    if (!this.fecha()) return;
    this.cargandoSlots.set(true);

    // Si hay sesión usamos el endpoint del backend (lógica autoritativa).
    if (this.isAuthed()) {
      this.api.getDisponibilidad(this.fecha()).subscribe({
        next: r => {
          this.ocupados.set(new Set(r.ocupados));
          this.cargandoSlots.set(false);
        },
        error: () => {
          this.ocupados.set(new Set());
          this.cargandoSlots.set(false);
        },
      });
      return;
    }

    // Invitado: consultamos Supabase con anon (necesita policy de SELECT
    // sobre appsalon_citas; si la policy lo bloquea, dejamos slots vacíos
    // y el backend rechazará con 409 al confirmar — el usuario verá el
    // error y elegirá otro horario).
    this.supa.client
      .from('appsalon_citas')
      .select('hora')
      .eq('fecha', this.fecha())
      .neq('estado', 'cancelada')
      .then(({ data, error }) => {
        if (error || !data) {
          this.ocupados.set(new Set());
        } else {
          const horas = data
            .map((r: { hora: string }) => (r.hora ?? '').slice(0, 5))
            .filter(Boolean);
          this.ocupados.set(new Set(horas));
        }
        this.cargandoSlots.set(false);
      });
  }

  reservar() {
    if (!this.puedeReservar()) return;

    // Si es invitado, validamos los 3 campos de contacto.
    if (!this.isAuthed()) {
      const nombre = this.guestNombre.trim();
      const email = this.guestEmail.trim();
      const tel = this.guestTelefono.trim();
      if (!nombre || !email || !tel) {
        Swal.fire({
          icon: 'warning',
          title: 'Faltan tus datos',
          text: 'Para reservar como invitado necesitamos nombre, teléfono y email.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#c7a24b',
        });
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        Swal.fire({
          icon: 'warning',
          title: 'Email inválido',
          text: 'Revisa el correo, ahí te enviaremos la confirmación.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#c7a24b',
        });
        return;
      }
    }

    this.guardando.set(true);
    this.api.createCita({
      fecha: this.fecha(),
      hora: this.hora().length === 5 ? `${this.hora()}:00` : this.hora(),
      servicio_ids: Array.from(this.seleccionados()),
      staff_id: this.staffId() ?? null,
      notas: this.notas.trim() || null,
      ...(this.isAuthed() ? {} : {
        guest_nombre: this.guestNombre.trim(),
        guest_email: this.guestEmail.trim(),
        guest_telefono: this.guestTelefono.trim(),
      }),
    } as any).subscribe({
      next: () => {
        const esGuest = !this.isAuthed();
        Swal.fire({
          icon: 'success',
          title: '¡Cita Reservada!',
          text: esGuest
            ? 'Te enviamos los detalles a tu correo. Llámanos al 56 3349 3004 si necesitas cambiar tu cita.'
            : 'Tu cita fue creada correctamente. Te enviaremos un recordatorio.',
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#c7a24b',
        }).then(() => this.router.navigateByUrl(esGuest ? '/' : '/mis-citas'));
      },
      error: (e) => {
        const msg = e?.status === 409
          ? (e?.error?.detail ?? 'Ese horario ya fue tomado.')
          : (e?.error?.detail ?? 'No se pudo guardar la cita.');
        Swal.fire({
          icon: 'error', title: 'Error', text: msg,
          background: '#1a1b15', color: '#ffffff', confirmButtonColor: '#cb0000',
        });
        if (e?.status === 409) {
          this.paso.set(3);
          this.cargarDisponibilidad();
        }
        this.guardando.set(false);
      },
    });
  }

  private generarSlots(): string[] {
    const out: string[] = [];
    const [h0, m0] = SLOT_MIN_INICIO.split(':').map(Number);
    const [hF, mF] = SLOT_MIN_FIN.split(':').map(Number);
    const m = (h: number, mm: number) => h * 60 + mm;
    const fin = m(hF, mF);
    for (let t = m(h0, m0); t <= fin; t += SLOT_INTERVALO_MIN) {
      out.push(`${String(Math.floor(t / 60)).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`);
    }
    return out;
  }

  private generarDias() {
    const out: { iso: string; dow: string; num: string; mon: string; relativo: string | null }[] = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const d = new Date(); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    let added = 0;
    while (added < 14) {
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) {
        const diffDays = Math.round((d.getTime() - hoy.getTime()) / 86400000);
        const relativo = diffDays === 0 ? 'Hoy'
                       : diffDays === 1 ? 'Mañana'
                       : null;
        out.push({
          iso: d.toISOString().slice(0, 10),
          dow: d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '').toUpperCase(),
          num: String(d.getDate()),
          mon: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase(),
          relativo,
        });
        added++;
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  /** Devuelve la hora de fin de un slot dado el total de duración elegida. */
  slotFin(inicio: string): string {
    const dur = this.duracionTotal();
    if (!dur) return inicio;
    const [h, m] = inicio.split(':').map(Number);
    const total = h * 60 + m + dur;
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
  }
}
