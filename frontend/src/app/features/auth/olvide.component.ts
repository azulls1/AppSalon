import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertaComponent } from '../../shared/alerta.component';

@Component({
  selector: 'app-olvide',
  imports: [FormsModule, RouterLink, AlertaComponent],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">¿Olvidaste tu Password?</h1>
    <p class="text-app-blanco/70 text-center mb-8">Te enviaremos un correo para reestablecerlo</p>

    <app-alerta [mensaje]="exito()" tipo="exito" />
    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5">
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2">Email</label>
        <input class="input" name="email" type="email" required [(ngModel)]="email" />
      </div>
      <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary w-full">
        {{ loading() ? 'Enviando...' : 'Enviar Instrucciones' }}
      </button>
    </form>

    <div class="mt-8 text-sm text-center">
      <a routerLink="/login" class="text-app-azul hover:underline">Volver al login</a>
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
export class OlvideComponent {
  private auth = inject(AuthService);
  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.resetPassword(this.email);
      this.exito.set('Revisa tu email para reestablecer tu password');
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo enviar el correo');
    } finally {
      this.loading.set(false);
    }
  }
}
