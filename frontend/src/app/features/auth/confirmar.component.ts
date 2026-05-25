import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-confirmar',
  imports: [RouterLink],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">{{ titulo() }}</h1>
    <p class="text-app-blanco/70 text-center mb-8">{{ mensaje() }}</p>
    @if (!cargando()) {
      <div class="text-center">
        <a routerLink="/login" class="inline-block rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-6 py-3 font-bold uppercase tracking-wide">
          Iniciar Sesión
        </a>
      </div>
    }
  `,
})
export class ConfirmarComponent {
  private supa = inject(SupabaseService);
  private router = inject(Router);

  cargando = signal(true);
  titulo = signal('Confirmando cuenta...');
  mensaje = signal('Un momento, estamos verificando tu cuenta.');

  constructor() {
    // Supabase ya intercepta el fragmento del hash y crea la sesión.
    // Aquí solo confirmamos visualmente el resultado.
    this.supa.client.auth.getSession().then(({ data, error }) => {
      this.cargando.set(false);
      if (error || !data.session) {
        this.titulo.set('Token no válido');
        this.mensaje.set('El enlace expiró o ya fue utilizado. Intenta iniciar sesión.');
        return;
      }
      this.titulo.set('Cuenta confirmada');
      this.mensaje.set('Tu cuenta ha sido confirmada correctamente. Ya puedes acceder.');
      setTimeout(() => this.router.navigateByUrl('/cita'), 2000);
    });
  }
}
