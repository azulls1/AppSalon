import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AlertaComponent } from '../../shared/alerta.component';
import { BarraNavComponent } from '../../shared/barra-nav.component';
import { ImageUploadComponent } from '../../shared/image-upload.component';

@Component({
  selector: 'app-recompensas-form',
  imports: [FormsModule, BarraNavComponent, AlertaComponent, ImageUploadComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">
      {{ esEdicion() ? 'Editar' : 'Nueva' }} Recompensa
    </h1>
    <p class="text-app-blanco/60 mb-4">Premios que los clientes pueden canjear con sus puntos</p>
    <app-barra-nav />

    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5 max-w-3xl">
      <section class="card">
        <header class="card-head"><h2 class="card-title">Información</h2></header>
        <div class="card-body space-y-4">
          <div>
            <label class="lbl">Nombre</label>
            <input class="input" name="nombre" required maxlength="120" [(ngModel)]="form.nombre"
                   placeholder="Ej. Corte de Cabello Gratis" />
          </div>
          <div>
            <label class="lbl">Descripción</label>
            <textarea class="input" name="descripcion" rows="2" maxlength="500"
                      [(ngModel)]="form.descripcion"
                      placeholder="¿Qué incluye? ¿En qué momento se canjea?"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">Costo en puntos</label>
              <input class="input" name="puntos_costo" type="number" min="1" max="10000" required
                     [(ngModel)]="form.puntos_costo" />
            </div>
            <div>
              <label class="lbl">Stock <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
              <input class="input" name="stock" type="number" min="0"
                     [(ngModel)]="form.stock" placeholder="Ilimitado" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Imagen</h2></header>
        <div class="card-body">
          <app-image-upload [url]="form.foto_url" (urlChange)="form.foto_url = $event" />
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Visibilidad</h2></header>
        <div class="card-body">
          <label class="toggle-row">
            <div>
              <p class="font-bold text-app-blanco">Activa en el catálogo</p>
              <p class="text-sm text-app-blanco/60">Solo las activas son visibles para los clientes.</p>
            </div>
            <span class="toggle">
              <input type="checkbox" class="peer toggle-input" name="activa" [(ngModel)]="form.activa" />
              <span class="toggle-slot"><span class="toggle-knob"></span></span>
            </span>
          </label>
        </div>
      </section>

      <div class="flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" (click)="cancelar()" class="btn-sec sm:w-auto">Cancelar</button>
        <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary sm:flex-1">
          {{ loading() ? 'Guardando...' : (esEdicion() ? 'Guardar Cambios' : 'Crear Recompensa') }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full rounded-md bg-white/5 border border-white/15 text-app-blanco px-4 py-2.5
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }
    .lbl { @apply block text-xs uppercase tracking-wide text-app-blanco/70 font-bold mb-2; }
    .card { @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden; }
    .card-head { @apply px-4 pt-4 pb-3 border-b border-white/10; }
    .card-title { @apply font-bold text-app-blanco; }
    .card-body { @apply p-4; }
    .toggle-row { @apply flex items-center justify-between gap-4 cursor-pointer; }
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
             font-bold uppercase tracking-wide transition-colors disabled:opacity-50;
    }
    .btn-sec {
      @apply h-12 rounded-md bg-white/10 hover:bg-white/15 text-app-blanco px-6
             font-bold uppercase tracking-wide transition-colors;
    }
  `],
})
export class RecompensasFormComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: { nombre: string; descripcion: string; puntos_costo: number;
          stock: number | null; foto_url: string | null; activa: boolean } = {
    nombre: '', descripcion: '', puntos_costo: 10,
    stock: null, foto_url: null, activa: true,
  };

  id = signal<string | null>(null);
  esEdicion = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.esEdicion.set(true);
      this.api.listRecompensas().subscribe(list => {
        const r = list.find(x => x.id === id);
        if (r) this.form = {
          nombre: r.nombre, descripcion: r.descripcion ?? '',
          puntos_costo: r.puntos_costo, stock: r.stock,
          foto_url: r.foto_url, activa: r.activa,
        };
      });
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const payload = {
      ...this.form,
      descripcion: this.form.descripcion || null,
      stock: this.form.stock === null || this.form.stock === undefined || (this.form.stock as any) === '' ? null : Number(this.form.stock),
    };
    const obs = this.esEdicion()
      ? this.api.updateRecompensa(this.id()!, payload)
      : this.api.createRecompensa(payload);
    obs.subscribe({
      next: () => this.router.navigateByUrl('/admin/recompensas'),
      error: (e) => { this.error.set(e?.error?.detail ?? 'Error al guardar'); this.loading.set(false); },
    });
  }
  cancelar() { this.router.navigateByUrl('/admin/recompensas'); }
}
