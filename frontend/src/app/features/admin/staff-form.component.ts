import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AlertaComponent } from '../../shared/alerta.component';
import { BarraNavComponent } from '../../shared/barra-nav.component';
import { ImageUploadComponent } from '../../shared/image-upload.component';

@Component({
  selector: 'app-staff-form',
  imports: [FormsModule, BarraNavComponent, AlertaComponent, ImageUploadComponent],
  template: `
    <h1 class="text-4xl font-black text-app-blanco mb-1">
      {{ esEdicion() ? 'Editar' : 'Nuevo' }} Estilista
    </h1>
    <p class="text-app-blanco/60 mb-4">
      {{ esEdicion() ? 'Actualiza los datos del estilista' : 'Agrega un miembro al equipo' }}
    </p>
    <app-barra-nav />

    <app-alerta [mensaje]="error()" tipo="error" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form (ngSubmit)="onSubmit()" #f="ngForm" class="lg:col-span-2 space-y-5">
        <section class="card">
          <header class="card-head">
            <h2 class="card-title">Información Personal</h2>
          </header>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="lbl">Nombre</label>
                <input class="input" name="nombre" required maxlength="60" [(ngModel)]="form.nombre" />
              </div>
              <div>
                <label class="lbl">Apellido</label>
                <input class="input" name="apellido" required maxlength="60" [(ngModel)]="form.apellido" />
              </div>
            </div>
            <div>
              <label class="lbl">Especialidad</label>
              <input class="input" name="especialidad" required maxlength="120"
                     [(ngModel)]="form.especialidad"
                     placeholder="Ej. Color y balayage" />
            </div>
            <div>
              <label class="lbl">Biografía <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
              <textarea class="input" name="bio" rows="3" maxlength="500"
                        [(ngModel)]="form.bio"
                        placeholder="Cuenta brevemente la experiencia y certificaciones..."></textarea>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2 class="card-title">Perfil Público</h2>
          </header>
          <div class="card-body space-y-4">
            <div>
              <label class="lbl">Foto</label>
              <app-image-upload [url]="form.foto_url" (urlChange)="form.foto_url = $event" />
              <p class="hint">Sube una imagen cuadrada (mín. 400×400 px, máx. 5 MB).</p>
            </div>
            <div>
              <label class="lbl">Instagram <span class="text-app-blanco/40 font-normal">(opcional)</span></label>
              <input class="input" name="instagram" [(ngModel)]="form.instagram"
                     placeholder="@usuario" />
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2 class="card-title">Disponibilidad</h2>
          </header>
          <div class="card-body">
            <label class="toggle-row">
              <div>
                <p class="font-bold text-app-blanco">Activo</p>
                <p class="text-sm text-app-blanco/60">
                  Solo los estilistas activos aparecen al reservar.
                </p>
              </div>
              <span class="toggle">
                <input type="checkbox" class="peer toggle-input" name="activo" [(ngModel)]="form.activo" />
                <span class="toggle-slot"><span class="toggle-knob"></span></span>
              </span>
            </label>
          </div>
        </section>

        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" (click)="cancelar()" class="btn-sec sm:w-auto">Cancelar</button>
          <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary sm:flex-1">
            {{ loading() ? 'Guardando...' : (esEdicion() ? 'Guardar Cambios' : 'Crear Estilista') }}
          </button>
        </div>
      </form>

      <!-- Preview -->
      <aside class="lg:col-span-1">
        <p class="text-xs uppercase tracking-wide font-bold text-app-blanco/60 mb-2">Vista Previa</p>
        <div class="prev" [class.opacity-60]="!form.activo">
          <img [src]="form.foto_url || 'https://i.pravatar.cc/300?u=' + (form.nombre || 'preview')"
               [alt]="form.nombre || 'preview'" class="prev-img" />
          <div class="p-3">
            <p class="font-bold text-app-blanco">{{ form.nombre || 'Nombre' }} {{ form.apellido }}</p>
            <p class="text-xs text-app-azul mt-0.5">{{ form.especialidad || 'Especialidad' }}</p>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full rounded-md bg-white/5 border border-white/15 text-app-blanco px-4 py-2.5
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }
    .lbl { @apply block text-xs uppercase tracking-wide text-app-blanco/70 font-bold mb-2; }
    .hint { @apply mt-1 text-xs text-app-blanco/50; }
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
    .prev { @apply rounded-lg bg-white/5 border border-white/15 overflow-hidden transition-opacity; }
    .prev-img { @apply w-full h-48 object-cover bg-white/10; }
  `],
})
export class StaffFormComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: { nombre: string; apellido: string; especialidad: string;
          bio: string; foto_url: string; instagram: string; activo: boolean } = {
    nombre: '', apellido: '', especialidad: '',
    bio: '', foto_url: '', instagram: '', activo: true,
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
      this.api.listStaff().subscribe(list => {
        const m = list.find(x => x.id === id);
        if (m) this.form = {
          nombre: m.nombre, apellido: m.apellido, especialidad: m.especialidad,
          bio: m.bio ?? '', foto_url: m.foto_url ?? '',
          instagram: m.instagram ?? '', activo: m.activo,
        };
      });
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const payload = { ...this.form, bio: this.form.bio || null, instagram: this.form.instagram || null };
    const obs = this.esEdicion()
      ? this.api.updateStaff(this.id()!, payload)
      : this.api.createStaff(payload);
    obs.subscribe({
      next: () => this.router.navigateByUrl('/admin/staff'),
      error: (e) => { this.error.set(e?.error?.detail ?? 'Error al guardar'); this.loading.set(false); },
    });
  }
  cancelar() { this.router.navigateByUrl('/admin/staff'); }
}
