import {
  Component,
  HostListener,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-scroll-progress',
  standalone: true,
  template: `
    <div class="scroll-progress" [style.transform]="'scaleX(' + progress() + ')'"></div>
  `,
  styles: [`
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #c7a24b 0%, #e8c976 50%, #c7a24b 100%);
      transform-origin: left center;
      transform: scaleX(0);
      transition: transform 80ms linear;
      z-index: 50;
      pointer-events: none;
      box-shadow: 0 0 12px rgba(199, 162, 75, 0.6);
    }
  `],
})
export class ScrollProgressComponent {
  private platformId = inject(PLATFORM_ID);
  progress = signal(0);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.update();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    this.progress.set(max > 0 ? h.scrollTop / max : 0);
  }
}
