import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PromoTipo } from '../../core/models/promo';
import { AlertaComponent } from '../../shared/alerta.component';
import { BarraNavComponent } from '../../shared/barra-nav.component';
import { ImageUploadComponent } from '../../shared/image-upload.component';

@Component({
  selector: 'app-promos-form',
  imports: [FormsModule, BarraNavComponent, AlertaComponent, ImageUploadComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">
      {{ esEdicion() ? 'Editar' : 'Nueva' }} Promoción
    </h1>
    <p class="text-app-blanco/60 mb-4">Descuentos y promos para clientes registrados</p>
    <app-barra-nav />

    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5 max-w-3xl">
      <section class="card">
        <header class="card-head"><h2 class="card-title">Información</h2></header>
        <div class="card-body space-y-4">
          <div>
            <label class="lbl">Título</label>
            <input class="input" name="titulo" required maxlength="120" [(ngModel)]="form.titulo"
                   placeholder="Ej. 20% off en tu cumpleaños" />
          </div>
          <div>
            <label class="lbl">Descripción</label>
            <textarea class="input" name="descripcion" rows="2" maxlength="500"
                      [(ngModel)]="form.descripcion"
                      placeholder="Detalles de la promo, condiciones, etc."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">Tipo</label>
              <select class="input" name="tipo" required [(ngModel)]="form.tipo">
                <option value="descuento_pct">% de descuento</option>
                <option value="descuento_fijo">$ fijo de descuento</option>
                <option value="servicio_gratis">Servicio gratis</option>
                <option value="producto_gratis">Producto gratis</option>
              </select>
            </div>
            <div>
              <label class="lbl">Valor</label>
              <input class="input" name="valor" type="number" min="0" step="0.01"
                     [(ngModel)]="form.valor"
                     [placeholder]="form.tipo === 'descuento_pct' ? '20 (= 20%)' : form.tipo === 'descuento_fijo' ? '50 MXN' : '0'" />
            </div>
          </div>
          <div>
            <label class="lbl">Código <span class="text-app-blanco/40 font-normal">(opcional, para mostrar al cliente)</span></label>
            <input class="input" name="codigo" maxlength="40" [(ngModel)]="form.codigo"
                   placeholder="Ej. CUMPLE25" />
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Vigencia y elegibilidad</h2></header>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">Desde <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
              <input class="input" name="vigencia_inicio" type="date" [(ngModel)]="form.vigencia_inicio" />
            </div>
            <div>
              <label class="lbl">Hasta <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
              <input class="input" name="vigencia_fin" type="date" [(ngModel)]="form.vigencia_fin" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="lbl">Mín. visitas</label>
              <input class="input" name="min_visitas" type="number" min="0" [(ngModel)]="form.min_visitas" />
            </div>
            <div>
              <label class="lbl">Mín. puntos</label>
              <input class="input" name="min_puntos" type="number" min="0" [(ngModel)]="form.min_puntos" />
            </div>
            <div>
              <label class="lbl">Canjes/usuario</label>
              <input class="input" name="max_canjes" type="number" min="1" max="99"
                     [(ngModel)]="form.max_canjes_por_usuario" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Banner / imagen</h2></header>
        <div class="card-body">
          <app-image-upload [url]="form.imagen_url" (urlChange)="form.imagen_url = $event" />
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Visibilidad</h2></header>
        <div class="card-body space-y-3">
          <label class="toggle-row">
            <div>
              <p class="font-bold text-app-blanco">Activa</p>
              <p class="text-sm text-app-blanco/60">Solo las activas se muestran a los clientes.</p>
            </div>
            <span class="toggle">
              <input type="checkbox" class="peer toggle-input" name="activa" [(ngModel)]="form.activa" />
              <span class="toggle-slot"><span class="toggle-knob"></span></span>
            </span>
          </label>
          <label class="toggle-row">
            <div>
              <p class="font-bold text-app-blanco">Destacada</p>
              <p class="text-sm text-app-blanco/60">Aparece como banner grande en "Mis Citas".</p>
            </div>
            <span class="toggle">
              <input type="checkbox" class="peer toggle-input" name="destacada" [(ngModel)]="form.destacada" />
              <span class="toggle-slot"><span class="toggle-knob"></span></span>
            </span>
          </label>
        </div>
      </section>

      <div class="flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" (click)="cancelar()" class="btn-sec sm:w-auto">Cancelar</button>
        <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary sm:flex-1">
          {{ loading() ? 'Guardando...' : (esEdicion() ? 'Guardar Cambios' : 'Crear Promoción') }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full rounded-md bg-white/5 border border-white/15 text-app-blanco px-4 py-2.5
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-oro focus:ring-2 focus:ring-app-oro/40;
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
             peer-checked:bg-app-oro peer-focus:ring-2 peer-focus:ring-app-oro/40;
    }
    .toggle-knob {
      @apply absolute left-1 top-1 w-5 h-5 rounded-full bg-app-blanco transition-transform;
    }
    .toggle-input:checked ~ .toggle-slot .toggle-knob { @apply translate-x-5; }
    .btn-primary {
      @apply h-12 rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro px-6
             font-bold uppercase tracking-wide transition-colors disabled:opacity-50;
    }
    .btn-sec {
      @apply h-12 rounded-md bg-white/10 hover:bg-white/15 text-app-blanco px-6
             font-bold uppercase tracking-wide transition-colors;
    }
  `],
})
export class PromosFormComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: {
    titulo: string;
    descripcion: string;
    tipo: PromoTipo;
    valor: number;
    vigencia_inicio: string | null;
    vigencia_fin: string | null;
    min_visitas: number;
    min_puntos: number;
    max_canjes_por_usuario: number;
    codigo: string;
    imagen_url: string | null;
    destacada: boolean;
    activa: boolean;
  } = {
    titulo: '', descripcion: '', tipo: 'descuento_pct', valor: 10,
    vigencia_inicio: null, vigencia_fin: null,
    min_visitas: 0, min_puntos: 0, max_canjes_por_usuario: 1,
    codigo: '', imagen_url: null, destacada: false, activa: true,
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
      this.api.listPromosAdmin().subscribe(list => {
        const p = list.find(x => x.id === id);
        if (p) {
          this.form = {
            titulo: p.titulo, descripcion: p.descripcion ?? '',
            tipo: p.tipo, valor: Number(p.valor) || 0,
            vigencia_inicio: p.vigencia_inicio, vigencia_fin: p.vigencia_fin,
            min_visitas: p.min_visitas, min_puntos: p.min_puntos,
            max_canjes_por_usuario: p.max_canjes_por_usuario,
            codigo: p.codigo ?? '', imagen_url: p.imagen_url,
            destacada: p.destacada, activa: p.activa,
          };
        }
      });
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const payload = {
      ...this.form,
      descripcion: this.form.descripcion || null,
      codigo: this.form.codigo.trim() || null,
      vigencia_inicio: this.form.vigencia_inicio || null,
      vigencia_fin: this.form.vigencia_fin || null,
      valor: Number(this.form.valor) || 0,
    };
    const obs = this.esEdicion()
      ? this.api.updatePromo(this.id()!, payload)
      : this.api.createPromo(payload);
    obs.subscribe({
      next: () => this.router.navigateByUrl('/admin/promos'),
      error: (e) => { this.error.set(e?.error?.detail ?? 'Error al guardar'); this.loading.set(false); },
    });
  }
  cancelar() { this.router.navigateByUrl('/admin/promos'); }
}
