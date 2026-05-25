import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertaComponent } from '../../shared/alerta.component';

function safeReturnUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  return url;
}

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, AlertaComponent],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Crear Cuenta</h1>
    <p class="text-app-blanco/70 text-center mb-8">Llena el formulario para registrarte</p>

    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Nombre</label>
          <input class="input" name="nombre" required [(ngModel)]="form.nombre" />
        </div>
        <div>
          <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Apellido</label>
          <input class="input" name="apellido" required [(ngModel)]="form.apellido" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Teléfono</label>
        <input class="input" name="telefono" type="tel" [(ngModel)]="form.telefono" />
      </div>
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Email</label>
        <input class="input" name="email" type="email" required [(ngModel)]="form.email" />
      </div>
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Password</label>
        <input class="input" name="password" type="password" required minlength="6" [(ngModel)]="form.password" />
      </div>
      <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary w-full">
        {{ loading() ? 'Creando...' : 'Crear Cuenta' }}
      </button>
    </form>

    <div class="mt-8 text-sm text-center">
      <a routerLink="/login" [queryParams]="returnUrlParams()" class="text-app-azul hover:underline">¿Ya tienes cuenta? Inicia sesión</a>
    </div>
  `,
  styles: [`
    @reference "../../../styles.css";
    .input {
      @apply w-full rounded-md bg-white/5 border border-white/15 text-app-blanco px-4 py-3
             placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul focus:ring-2 focus:ring-app-azul/40;
    }
    .btn-primary {
      @apply rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-6 py-3
             font-bold text-base uppercase tracking-wide
             transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
    }
  `],
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = { nombre: '', apellido: '', telefono: '', email: '', password: '' };
  loading = signal(false);
  error = signal<string | null>(null);

  returnUrlParams(): Record<string, string> {
    const r = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    return r ? { returnUrl: r } : {};
  }

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signUp(this.form);
      this.router.navigate(['/mensaje'], { queryParams: this.returnUrlParams() });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear la cuenta');
      this.loading.set(false);
    }
  }
}
