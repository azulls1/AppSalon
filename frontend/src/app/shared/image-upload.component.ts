import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-image-upload',
  imports: [FormsModule],
  template: `
    <div class="wrap">
      @if (preview()) {
        <img [src]="preview()" alt="preview" class="thumb" />
      } @else {
        <div class="placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <circle cx="9" cy="11" r="2"/>
            <path d="M21 19l-5-5L3 19" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      }
      <div class="ctrl">
        <label class="btn-file" [class.cargando]="cargando()">
          <input type="file" accept="image/*" (change)="onFile($event)" hidden [disabled]="cargando()" />
          {{ cargando() ? 'Subiendo...' : (preview() ? 'Cambiar imagen' : 'Subir imagen') }}
        </label>
        @if (showUrl()) {
          <details class="url-block">
            <summary>O pega una URL</summary>
            <input type="url" [(ngModel)]="urlInput"
                   placeholder="https://..." class="url-input"
                   (change)="onUrlChange()" />
          </details>
        }
        @if (error()) { <p class="err">{{ error() }}</p> }
      </div>
    </div>
  `,
  styles: [`
    @reference "../../styles.css";
    .wrap { @apply flex items-start gap-4; }
    .thumb {
      @apply w-32 h-32 object-cover rounded-md bg-white/5 border border-white/15 shrink-0;
    }
    .placeholder {
      @apply w-32 h-32 shrink-0 rounded-md bg-white/5 border border-dashed border-white/15
             flex items-center justify-center text-app-blanco/40;
    }
    .placeholder svg { @apply w-10 h-10; }
    .ctrl { @apply flex-1 min-w-0; }
    .btn-file {
      @apply inline-block px-4 py-2.5 rounded-md bg-app-azul hover:bg-app-azul-hover
             text-app-blanco text-sm font-bold uppercase tracking-wide cursor-pointer transition-colors;
    }
    .btn-file.cargando { @apply opacity-60 cursor-wait; }
    .url-block { @apply mt-3 text-xs; }
    .url-block summary {
      @apply text-app-blanco/60 cursor-pointer hover:text-app-blanco
             font-bold uppercase tracking-wide;
    }
    .url-input {
      @apply w-full mt-2 px-3 py-2 rounded-md bg-white/5 border border-white/15
             text-app-blanco text-sm placeholder:text-app-blanco/40
             focus:outline-none focus:border-app-azul;
    }
    .err { @apply mt-2 text-xs text-app-rojo font-bold; }
  `],
})
export class ImageUploadComponent {
  private api = inject(ApiService);

  url = input<string | null>(null);
  urlChange = output<string>();
  showUrl = input(true);

  cargando = signal(false);
  error = signal<string | null>(null);
  preview = signal<string | null>(null);
  urlInput = '';

  constructor() {
    queueMicrotask(() => {
      const v = this.url();
      if (v) { this.preview.set(v); this.urlInput = v; }
    });
  }

  async onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La imagen no puede pesar más de 5 MB.');
      return;
    }
    this.error.set(null);
    this.cargando.set(true);
    // Preview local inmediato
    const tempUrl = URL.createObjectURL(file);
    this.preview.set(tempUrl);

    this.api.uploadImage(file).subscribe({
      next: (r) => {
        URL.revokeObjectURL(tempUrl);
        this.preview.set(r.url);
        this.urlInput = r.url;
        this.urlChange.emit(r.url);
        this.cargando.set(false);
      },
      error: (e) => {
        URL.revokeObjectURL(tempUrl);
        this.preview.set(this.url() ?? null);
        this.error.set(e?.error?.detail ?? 'No se pudo subir la imagen');
        this.cargando.set(false);
      },
    });
  }

  onUrlChange() {
    const v = this.urlInput.trim();
    this.preview.set(v || null);
    this.urlChange.emit(v);
  }
}
