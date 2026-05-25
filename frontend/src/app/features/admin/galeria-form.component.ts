import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Servicio } from '../../core/models/servicio';
import { AlertaComponent } from '../../shared/alerta.component';
import { BarraNavComponent } from '../../shared/barra-nav.component';
import { ImageUploadComponent } from '../../shared/image-upload.component';

@Component({
  selector: 'app-galeria-form',
  imports: [FormsModule, BarraNavComponent, AlertaComponent, ImageUploadComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">
      {{ esEdicion() ? 'Editar' : 'Nuevo' }} Item de Galería
    </h1>
    <p class="text-app-blanco/60 mb-4">Comparte un trabajo de antes y después</p>
    <app-barra-nav />

    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5 max-w-3xl">
      <section class="card">
        <header class="card-head"><h2 class="card-title">Detalles</h2></header>
        <div class="card-body space-y-4">
          <div>
            <label class="lbl">Título</label>
            <input class="input" name="titulo" required maxlength="120" [(ngModel)]="form.titulo"
                   placeholder="Ej. Balayage caramelo desde cabello virgen" />
          </div>
          <div>
            <label class="lbl">Descripción <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
            <textarea class="input" name="descripcion" rows="2" maxlength="500"
                      [(ngModel)]="form.descripcion"
                      placeholder="Cuenta brevemente la transformación..."></textarea>
          </div>
          <div>
            <label class="lbl">Servicio relacionado <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
            <select class="input" name="servicio_id" [(ngModel)]="form.servicio_id">
              <option [ngValue]="null">— Ninguno —</option>
              @for (s of servicios(); track s.id) {
                <option [ngValue]="s.id">{{ s.nombre }}</option>
              }
            </select>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Fotos</h2></header>
        <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="lbl">Foto "Antes"</label>
            <app-image-upload [url]="form.foto_antes_url" (urlChange)="form.foto_antes_url = $event" />
          </div>
          <div>
            <label class="lbl">Foto "Después"</label>
            <app-image-upload [url]="form.foto_despues_url" (urlChange)="form.foto_despues_url = $event" />
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2 class="card-title">Visibilidad</h2></header>
        <div class="card-body">
          <label class="toggle-row">
            <div>
              <p class="font-bold text-app-blanco">Visible públicamente</p>
              <p class="text-sm text-app-blanco/60">Solo los items visibles aparecen en /galeria.</p>
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
          {{ loading() ? 'Guardando...' : (esEdicion() ? 'Guardar Cambios' : 'Crear Item') }}
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
    .preview-img { @apply w-full h-32 object-cover rounded-md bg-white/10 border border-white/10; }
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
export class GaleriaFormComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: { titulo: string; descripcion: string; foto_antes_url: string;
          foto_despues_url: string; servicio_id: string | null; activa: boolean } = {
    titulo: '', descripcion: '', foto_antes_url: '', foto_despues_url: '',
    servicio_id: null, activa: true,
  };

  id = signal<string | null>(null);
  esEdicion = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  servicios = signal<Servicio[]>([]);

  constructor() {
    this.api.listServicios().subscribe(s => this.servicios.set(s));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.esEdicion.set(true);
      this.api.listGaleria().subscribe(list => {
        const g = list.find(x => x.id === id);
        if (g) this.form = {
          titulo: g.titulo, descripcion: g.descripcion ?? '',
          foto_antes_url: g.foto_antes_url, foto_despues_url: g.foto_despues_url,
          servicio_id: g.servicio_id, activa: g.activa,
        };
      });
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const payload = { ...this.form, descripcion: this.form.descripcion || null };
    const obs = this.esEdicion()
      ? this.api.updateGaleria(this.id()!, payload)
      : this.api.createGaleria(payload);
    obs.subscribe({
      next: () => this.router.navigateByUrl('/admin/galeria'),
      error: (e) => { this.error.set(e?.error?.detail ?? 'Error al guardar'); this.loading.set(false); },
    });
  }
  cancelar() { this.router.navigateByUrl('/admin/galeria'); }
}
