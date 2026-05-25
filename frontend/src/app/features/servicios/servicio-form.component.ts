import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { BarraNavComponent } from '../../shared/barra-nav.component';
import { AlertaComponent } from '../../shared/alerta.component';

@Component({
  selector: 'app-servicio-form',
  imports: [FormsModule, CurrencyPipe, BarraNavComponent, AlertaComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">
      {{ esEdicion() ? 'Editar' : 'Nuevo' }} Servicio
    </h1>
    <p class="text-app-blanco/60 mb-4">
      {{ esEdicion() ? 'Actualiza los datos del servicio' : 'Agrega un servicio al catálogo' }}
    </p>
    <app-barra-nav />

    <app-alerta [mensaje]="error()" tipo="error" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form -->
      <form (ngSubmit)="onSubmit()" #f="ngForm" class="lg:col-span-2 space-y-6">
        <section class="card">
          <header class="card-head">
            <h2 class="card-title">Información Básica</h2>
            <p class="card-sub">Nombre del servicio y precio actual</p>
          </header>
          <div class="card-body space-y-5">
            <div>
              <label class="lbl" for="nombre">Nombre</label>
              <input id="nombre" class="input" name="nombre" required maxlength="120"
                     [(ngModel)]="form.nombre" #nombreCtrl="ngModel"
                     placeholder="Ej. Corte de Cabello Mujer" />
              @if (nombreCtrl.touched && nombreCtrl.invalid) {
                <p class="hint-err">Escribe un nombre.</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="lbl" for="precio">Precio</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-app-blanco/50 font-bold">$</span>
                  <input id="precio" class="input pl-7" name="precio" type="number" min="0" step="0.01" required
                         [(ngModel)]="form.precio" #precioCtrl="ngModel" placeholder="0.00" />
                </div>
                @if (precioCtrl.touched && precioCtrl.invalid) {
                  <p class="hint-err">El precio no puede ser negativo.</p>
                }
              </div>
              <div>
                <label class="lbl" for="duracion_min">Duración</label>
                <div class="relative">
                  <input id="duracion_min" class="input pr-12" name="duracion_min" type="number" min="5" max="480" step="5" required
                         [(ngModel)]="form.duracion_min" #durCtrl="ngModel" placeholder="30" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-app-blanco/50 text-xs font-bold">min</span>
                </div>
                @if (durCtrl.touched && durCtrl.invalid) {
                  <p class="hint-err">Duración entre 5 y 480 minutos.</p>
                }
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2 class="card-title">Disponibilidad</h2>
            <p class="card-sub">Controla si el servicio aparece para reservar</p>
          </header>
          <div class="card-body">
            <label class="toggle-row">
              <div>
                <p class="font-bold text-app-blanco">Servicio activo</p>
                <p class="text-sm text-app-blanco/60">
                  Los clientes solo ven los servicios activos en el booking.
                </p>
              </div>
              <span class="toggle">
                <input type="checkbox" name="activo" class="peer toggle-input"
                       [(ngModel)]="form.activo" />
                <span class="toggle-slot"><span class="toggle-knob"></span></span>
              </span>
            </label>
          </div>
        </section>

        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" (click)="cancelar()" class="btn-sec sm:w-auto">Cancelar</button>
          <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary sm:flex-1">
            {{ loading() ? 'Guardando...' : (esEdicion() ? 'Guardar Cambios' : 'Crear Servicio') }}
          </button>
        </div>
      </form>

      <!-- Live preview -->
      <aside class="lg:col-span-1">
        <p class="text-xs uppercase tracking-wide font-bold text-app-blanco/60 mb-2">
          Vista Previa
        </p>
        <div class="prev-card" [class.opacity-60]="!form.activo">
          <div class="flex items-start justify-between gap-2">
            <p class="font-bold text-app-blanco text-lg leading-tight">
              {{ form.nombre || 'Nombre del servicio' }}
            </p>
            <span [class]="form.activo ? 'badge badge-on' : 'badge badge-off'">
              {{ form.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div class="flex items-end justify-between mt-3">
            <p class="text-3xl font-black text-app-azul">{{ precioPreview() | currency:'MXN' }}</p>
            <p class="text-xs text-app-blanco/60 font-bold flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ form.duracion_min || 30 }} min
            </p>
          </div>
          <p class="text-xs text-app-blanco/50 mt-2">
            Así aparecerá en la pantalla de Servicios.
          </p>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full h-11 rounded-md bg-white/5 border border-white/15 text-app-blanco px-4
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }
    .lbl {
      @apply block text-xs uppercase tracking-wide text-app-blanco/70 font-bold mb-2;
    }
    .hint-err { @apply mt-1 text-xs text-app-rojo font-bold; }

    .card { @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden; }
    .card-head { @apply px-4 pt-4 pb-3 border-b border-white/10; }
    .card-title { @apply font-bold text-app-blanco; }
    .card-sub { @apply text-xs text-app-blanco/60 mt-0.5; }
    .card-body { @apply p-4; }

    .toggle-row {
      @apply flex items-center justify-between gap-4 cursor-pointer;
    }
    .toggle { @apply relative inline-block w-12 h-7 shrink-0; }
    .toggle-input { @apply absolute opacity-0 w-0 h-0; }
    .toggle-slot {
      @apply absolute inset-0 rounded-full bg-white/15 transition-colors
             peer-checked:bg-app-azul peer-focus:ring-2 peer-focus:ring-app-azul/40;
    }
    .toggle-knob {
      @apply absolute left-1 top-1 w-5 h-5 rounded-full bg-app-blanco transition-transform;
    }
    .toggle-input:checked ~ .toggle-slot .toggle-knob { @apply translate-x-5; }

    .btn-primary {
      @apply h-12 rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-6
             font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .btn-sec {
      @apply h-12 rounded-md bg-white/10 hover:bg-white/15 text-app-blanco px-6
             font-bold uppercase tracking-wide transition-colors;
    }

    .prev-card { @apply rounded-lg bg-white/5 border border-white/15 p-4 transition-opacity; }
    .badge {
      @apply text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full shrink-0;
    }
    .badge-on  { @apply bg-app-verde/20 text-app-verde border border-app-verde/40; }
    .badge-off { @apply bg-app-blanco/10 text-app-blanco/50 border border-app-blanco/20; }
  `],
})
export class ServicioFormComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = { nombre: '', precio: 0, duracion_min: 30, activo: true };
  id = signal<string | null>(null);
  esEdicion = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  precioPreview = computed(() => Number(this.form.precio) || 0);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.esEdicion.set(true);
      this.api.listServicios().subscribe(list => {
        const s = list.find(x => x.id === id);
        if (s) this.form = {
          nombre: s.nombre,
          precio: +s.precio,
          duracion_min: s.duracion_min ?? 30,
          activo: s.activo,
        };
      });
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const payload = {
      nombre: this.form.nombre,
      precio: Number(this.form.precio),
      duracion_min: Number(this.form.duracion_min) || 30,
      activo: this.form.activo,
    };
    const obs = this.esEdicion()
      ? this.api.updateServicio(this.id()!, payload)
      : this.api.createServicio(payload);
    obs.subscribe({
      next: () => this.router.navigateByUrl('/servicios'),
      error: (e) => { this.error.set(e?.error?.detail ?? 'Error al guardar'); this.loading.set(false); },
    });
  }

  cancelar() { this.router.navigateByUrl('/servicios'); }
}
