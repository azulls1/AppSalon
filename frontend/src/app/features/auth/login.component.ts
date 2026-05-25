import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertaComponent } from '../../shared/alerta.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AlertaComponent],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Iniciar Sesión</h1>
    <p class="text-app-blanco/70 text-center mb-8">Inicia sesión con tus datos</p>

    <app-alerta [mensaje]="error()" tipo="error" />

    <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-5">
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2" for="email">Email</label>
        <input id="email" name="email" type="email" required
               [(ngModel)]="email" class="input" placeholder="tu@email.com" autocomplete="email" />
      </div>
      <div>
        <label class="block text-sm font-bold uppercase tracking-wide text-app-blanco mb-2" for="password">Password</label>
        <input id="password" name="password" type="password" required minlength="6"
               [(ngModel)]="password" class="input" placeholder="••••••" autocomplete="current-password" />
      </div>
      <button type="submit" [disabled]="loading() || f.invalid" class="btn-primary w-full">
        {{ loading() ? 'Entrando...' : 'Iniciar Sesión' }}
      </button>
    </form>

    <div class="mt-8 flex flex-col gap-2 text-sm text-center">
      <a routerLink="/crear-cuenta" class="text-app-azul hover:underline">¿Aún no tienes cuenta? Crear una</a>
      <a routerLink="/olvide"       class="text-app-azul hover:underline">¿Olvidaste tu password?</a>
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
export class LoginComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signIn(this.email, this.password);
      try {
        const me = await firstValueFrom(this.api.getMe());
        this.router.navigateByUrl(me.is_admin ? '/admin' : '/cita');
      } catch {
        this.router.navigateByUrl('/cita');
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}
