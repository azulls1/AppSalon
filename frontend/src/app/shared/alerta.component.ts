import { Component, input } from '@angular/core';

export type AlertaTipo = 'exito' | 'error' | 'info';

@Component({
  selector: 'app-alerta',
  template: `
    @if (mensaje()) {
      <div [class]="classes()" role="alert">{{ mensaje() }}</div>
    }
  `,
})
export class AlertaComponent {
  mensaje = input<string | null>(null);
  tipo = input<AlertaTipo>('info');

  classes() {
    const base = 'rounded-md px-4 py-3 text-sm font-bold uppercase tracking-wide text-center mb-4 text-white';
    switch (this.tipo()) {
      case 'exito': return `${base} bg-app-verde`;
      case 'error': return `${base} bg-app-rojo`;
      default:      return `${base} bg-app-azul`;
    }
  }
}
