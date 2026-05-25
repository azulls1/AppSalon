import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h1 class="text-7xl lg:text-8xl font-black text-app-azul text-center mb-4">404</h1>
    <p class="text-app-blanco/70 text-center mb-8">Página no encontrada o ruta no válida.</p>
    <div class="text-center">
      <a routerLink="/login" class="inline-block rounded-md bg-app-azul hover:bg-app-azul-hover text-app-blanco px-6 py-3 font-bold uppercase tracking-wide">
        Volver al Inicio
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
