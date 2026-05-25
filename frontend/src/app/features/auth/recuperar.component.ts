import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertaComponent } from '../../shared/alerta.component';

@Component({
  selector: 'app-recuperar',
  imports: [FormsModule, AlertaComponent],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Nuevo Password</h1>
    <p class="text-app-blanco/70 text-center mb-8">Define una nueva contraseña</p>

    <app-alerta [mensaje]="error()" tipo="error" />
    <app-alerta [mensaje]="exito()" tipo="exito" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5">
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Nuevo password</label>
        <input class="input" name="password" type="password" required minlength="6" [(ngModel)]="password" />
      </div>
      <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary w-full">
        {{ loading() ? 'Guardando...' : 'Guardar' }}
      </button>
    </form>
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
export class RecuperarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.updatePassword(this.password);
      this.exito.set('Password actualizado');
      setTimeout(() => this.router.navigateByUrl('/login'), 1500);
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo actualizar');
    } finally {
      this.loading.set(false);
    }
  }
}
