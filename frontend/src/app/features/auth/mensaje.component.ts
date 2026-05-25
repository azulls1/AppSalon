import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mensaje',
  imports: [RouterLink],
  template: `
    <h1 class="text-4xl lg:text-5xl font-black text-app-blanco text-center mb-2">Cuenta Creada</h1>
    <p class="text-app-blanco/70 text-center mb-8">
      Hemos enviado un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta.
    </p>
    <div class="text-center">
      <a routerLink="/login" class="inline-block rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-6 py-3 font-bold uppercase tracking-wide">
        Ir al Login
      </a>
    </div>
  `,
})
export class MensajeComponent {}
