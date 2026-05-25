import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScrollProgressComponent } from './shared/scroll-progress.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ScrollProgressComponent],
  template: `
    <app-scroll-progress></app-scroll-progress>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
