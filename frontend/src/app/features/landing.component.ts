import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SupabaseService } from '../core/services/supabase.service';
import { Servicio } from '../core/models/servicio';
import { Staff } from '../core/models/staff';
import { Galeria } from '../core/models/galeria';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <main class="min-h-screen bg-app-negro">

      <!-- Header / nav -->
      <header class="border-b border-app-oro/15 bg-app-negro/95 backdrop-blur sticky top-0 z-20">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-3">
            <img src="/images/logo.jpg" alt="Mike's Club Barber Shop"
                 class="brand-logo" />
            <span class="logo font-hero text-2xl">
              <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
            </span>
            <span class="tag">Barbería</span>
          </a>
          <nav class="flex items-center gap-1 sm:gap-2">
            <a routerLink="/"          class="nav-link-active hidden sm:inline-block">Inicio</a>
            <a routerLink="/equipo"    class="nav-link hidden sm:inline-block">Barberos</a>
            <a routerLink="/galeria"   class="nav-link hidden sm:inline-block">Galería</a>
            <a routerLink="/ubicacion" class="nav-link hidden sm:inline-block">La Casa</a>
            @if (isLoggedIn()) {
              <a [routerLink]="dashboardLink()" class="btn-primary">{{ isAdmin() ? 'Panel' : 'Mi Cuenta' }}</a>
            } @else {
              <a routerLink="/login" class="btn-ghost">Entrar</a>
              <a routerLink="/crear-cuenta" class="btn-primary">Reservar</a>
            }
          </nav>
        </div>
      </header>

      <!-- Hero -->
      <section class="relative overflow-hidden">
        <div class="absolute inset-0 bg-cover bg-center opacity-25"
             style="background-image: url('/salon.jpg');"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-app-negro via-app-negro/70 to-transparent"></div>
        <img src="/images/logo.jpg" alt=""
             aria-hidden="true"
             class="hero-watermark" />
        <div class="relative max-w-6xl mx-auto px-6 py-24 lg:py-36">
          <p class="font-serif text-app-oro/90 italic mb-3 tracking-wide">Establecido en 2024</p>
          <h1 class="font-hero text-6xl lg:text-8xl text-app-blanco max-w-4xl leading-[0.95] uppercase">
            Una silla.<br>
            Una navaja.<br>
            <span class="text-app-oro">Un ritual.</span>
          </h1>
          <p class="text-lg lg:text-xl text-app-blanco/80 mt-8 max-w-2xl">
            El oficio del barbero, sin atajos. Corte, barba y afeitado clásico a navaja
            para el caballero que sabe distinguir.
          </p>
          <div class="flex flex-wrap gap-3 mt-10">
            @if (isLoggedIn()) {
              <a routerLink="/cita" class="btn-primary text-base px-8 py-4">Reservar mi silla</a>
            } @else {
              <a routerLink="/crear-cuenta" class="btn-primary text-base px-8 py-4">Reservar mi silla</a>
            }
            <a href="#servicios" class="btn-ghost text-base px-8 py-4">Ver Carta</a>
          </div>
        </div>
      </section>

      <!-- Manifiesto -->
      <section class="border-y border-app-oro/15 bg-app-negro-soft">
        <div class="max-w-4xl mx-auto px-6 py-16 text-center">
          <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-4">Nuestro Oficio</p>
          <p class="font-serif text-2xl lg:text-3xl text-app-blanco leading-relaxed">
            "Cada corte es un ritual. Cada navaja, una declaración. Aquí no servimos
            modas — servimos el estilo del caballero que llega y el del que se va."
          </p>
          <div class="mt-6 inline-flex items-center gap-3 text-app-blanco/40 text-sm">
            <span class="block h-px w-12 bg-app-oro/40"></span>
            <span class="font-serif italic">— La Casa</span>
            <span class="block h-px w-12 bg-app-oro/40"></span>
          </div>
        </div>
      </section>

      <!-- ¿Por qué? -->
      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (f of features; track f.titulo) {
            <div class="feature">
              <div class="feature-icon" [innerHTML]="f.icon"></div>
              <h3 class="font-bold text-app-blanco text-lg mt-4">{{ f.titulo }}</h3>
              <p class="text-app-blanco/60 text-sm mt-1">{{ f.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Carta de servicios -->
      <section id="servicios" class="bg-white/[0.03] border-y border-app-oro/15 py-20">
        <div class="max-w-6xl mx-auto px-6">
          <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase text-center mb-3">La Carta</p>
          <h2 class="font-hero text-5xl lg:text-6xl text-app-blanco text-center uppercase">Servicios</h2>
          <p class="text-app-blanco/70 text-center mt-3 mb-12">Precios honestos. Ritual incluido.</p>

          @if (cargando()) {
            <p class="text-center text-app-blanco/50">Cargando...</p>
          } @else if (servicios().length === 0) {
            <p class="text-center text-app-blanco/50">No hay servicios disponibles.</p>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (s of servicios(); track s.id) {
                <div class="srv" [class.srv-signature]="esSignature(s.nombre)">
                  @if (esSignature(s.nombre)) {
                    <span class="signature-badge">Signature</span>
                  }
                  <p class="font-bold text-app-blanco text-lg leading-tight">{{ s.nombre }}</p>
                  <div class="flex items-end justify-between mt-3">
                    <p class="text-3xl font-black text-app-oro">{{ +s.precio | currency:'MXN' }}</p>
                    <p class="text-xs text-app-blanco/60 font-bold">{{ s.duracion_min }} min</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Equipo -->
      <section class="max-w-6xl mx-auto px-6 py-20">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-3">Detrás de la Silla</p>
            <h2 class="font-hero text-5xl lg:text-6xl text-app-blanco uppercase">Nuestros Barberos</h2>
            <p class="text-app-blanco/70 mt-2">Maestros del oficio con años en las navajas</p>
          </div>
          <a routerLink="/equipo" class="hidden sm:inline-block text-sm font-bold uppercase tracking-wide text-app-oro hover:underline">
            Ver todos →
          </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (m of equipoDestacado(); track m.id) {
            <a routerLink="/equipo" class="team-card">
              <img [src]="m.foto_url" [alt]="m.nombre" class="team-img" />
              <div class="p-3">
                <p class="font-bold text-app-blanco">{{ m.nombre }} {{ m.apellido }}</p>
                <p class="text-xs text-app-oro mt-0.5">{{ m.especialidad }}</p>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- Galería teaser -->
      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-3">Trabajo Real</p>
            <h2 class="font-hero text-5xl lg:text-6xl text-app-blanco uppercase">Antes y Después</h2>
          </div>
          <a routerLink="/galeria" class="hidden sm:inline-block text-sm font-bold uppercase tracking-wide text-app-oro hover:underline">
            Ver portafolio →
          </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (g of galeria(); track g.id) {
            <a routerLink="/galeria" class="gal-teaser">
              <div class="grid grid-cols-2">
                <img [src]="g.foto_antes_url" alt="antes" class="gal-img" />
                <img [src]="g.foto_despues_url" alt="después" class="gal-img" />
              </div>
              <p class="p-3 font-bold text-app-blanco text-sm leading-tight">{{ g.titulo }}</p>
            </a>
          }
        </div>
      </section>

      <!-- Ubicación teaser -->
      <section class="bg-white/[0.03] border-y border-app-oro/15">
        <div class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-3">La Casa</p>
            <h2 class="font-hero text-4xl lg:text-5xl text-app-blanco uppercase">Visítanos en Polanco</h2>
            <p class="text-app-blanco/70 mt-3">
              Av. Presidente Masaryk 169. Lunes a Viernes de 10:00 a 18:00.
              Te recibimos con un whisky o un café, según la hora.
            </p>
            <a routerLink="/ubicacion" class="inline-block mt-6 btn-primary">Cómo llegar</a>
          </div>
          <div class="rounded-lg overflow-hidden border border-app-oro/15 h-64">
            <iframe src="https://www.google.com/maps?q=Polanco+Ciudad+de+M%C3%A9xico&output=embed"
                    width="100%" height="100%" style="border:0" loading="lazy"></iframe>
          </div>
        </div>
      </section>

      <!-- CTA final -->
      <section class="max-w-3xl mx-auto px-6 py-24 text-center">
        <p class="text-app-oro text-xs tracking-[0.3em] font-bold uppercase mb-4">Tu barbero te atenderá ahora</p>
        <h2 class="font-hero text-5xl lg:text-7xl text-app-blanco uppercase leading-[0.95]">
          La silla está<br><span class="text-app-oro">esperando.</span>
        </h2>
        <p class="text-app-blanco/70 text-lg mt-6">
          Crea tu cuenta gratis y reserva tu primera cita en menos de un minuto.
        </p>
        <div class="flex flex-wrap gap-3 justify-center mt-8">
          @if (isLoggedIn()) {
            <a routerLink="/cita" class="btn-primary text-base px-10 py-4">Reservar Ahora</a>
          } @else {
            <a routerLink="/crear-cuenta" class="btn-primary text-base px-10 py-4">Crear Cuenta</a>
            <a routerLink="/login" class="btn-ghost text-base px-10 py-4">Ya soy cliente</a>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-app-oro/15 py-10 bg-app-negro-soft">
        <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="/images/logo.jpg" alt="Mike's Club Barber Shop" class="brand-logo brand-logo-sm" />
            <span class="logo font-hero text-xl">
              <span class="text-app-oro">APP</span><span class="text-app-blanco">SALON</span>
            </span>
            <span class="text-xs text-app-blanco/40 uppercase tracking-wider">Barbería · Est. 2024</span>
          </div>
          <p class="text-app-blanco/40 text-sm">
            © 2026 Mike's Club Barber Shop · Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  `,
  styles: [`
    @reference "../../styles.css";

    .logo { letter-spacing: 0.05em; }
    .tag {
      @apply text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded
             border border-app-oro/50 text-app-oro;
    }

    .brand-logo {
      @apply w-11 h-11 rounded-md object-contain
             ring-1 ring-app-oro/40 bg-app-negro shrink-0;
    }
    .brand-logo-sm { @apply w-8 h-8; }

    .hero-watermark {
      @apply absolute pointer-events-none select-none
             right-[-2rem] sm:right-4 top-1/2 -translate-y-1/2
             w-72 sm:w-96 lg:w-[28rem] opacity-[0.08]
             mix-blend-screen drop-shadow-2xl;
    }

    .btn-primary {
      @apply rounded-md bg-app-oro hover:bg-app-oro-hover text-app-negro px-5 py-2.5
             text-sm font-bold uppercase tracking-wider transition-colors inline-block;
    }
    .btn-ghost {
      @apply rounded-md border border-app-oro/40 hover:bg-app-oro/10 text-app-blanco px-5 py-2.5
             text-sm font-bold uppercase tracking-wider transition-colors inline-block;
    }

    .nav-link, .nav-link-active {
      @apply text-xs font-bold uppercase tracking-[0.15em]
             hover:text-app-oro transition-colors px-3 py-2;
    }
    .nav-link { @apply text-app-blanco/60; }
    .nav-link-active { @apply text-app-oro; }

    .feature {
      @apply rounded-lg bg-white/5 border border-app-oro/15 p-6 text-center;
    }
    .feature-icon {
      @apply w-14 h-14 mx-auto rounded-full bg-app-oro/15 text-app-oro
             flex items-center justify-center;
    }
    .feature-icon ::ng-deep svg { width: 1.75rem; height: 1.75rem; }

    .srv {
      @apply relative rounded-lg bg-app-negro border border-white/15 p-5
             hover:border-app-oro/60 hover:bg-white/[0.06] transition-all;
    }
    .srv-signature {
      @apply border-app-oro/60 bg-gradient-to-br from-app-oro/10 to-transparent;
    }
    .signature-badge {
      @apply absolute -top-2 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase
             tracking-widest bg-app-oro text-app-negro;
    }

    .team-card {
      @apply rounded-lg bg-white/5 border border-app-oro/15 overflow-hidden
             hover:border-app-oro/50 transition-all block;
    }
    .team-img { @apply w-full h-44 object-cover bg-white/10 grayscale hover:grayscale-0 transition-all; }

    .gal-teaser {
      @apply rounded-lg bg-white/5 border border-app-oro/15 overflow-hidden block
             hover:border-app-oro/50 transition-all;
    }
    .gal-img { @apply w-full h-40 object-cover bg-white/10; }
    .gal-teaser .gal-img:first-child { @apply border-r border-white/10; }
  `],
})
export class LandingComponent {
  private auth = inject(AuthService);
  private supa = inject(SupabaseService);

  servicios = signal<Servicio[]>([]);
  equipoDestacado = signal<Staff[]>([]);
  galeria = signal<Galeria[]>([]);
  cargando = signal(true);

  isLoggedIn = computed(() => this.auth.isAuthenticated());
  isAdmin = signal(false);
  dashboardLink = computed(() => (this.isAdmin() ? '/admin' : '/cita'));

  readonly features = [
    {
      titulo: 'Reserva 24/7',
      desc: 'Agenda con tu barbero desde el celular, cuando quieras. Sin llamadas ni esperas.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
    },
    {
      titulo: 'Oficio Real',
      desc: 'Barberos formados con años en las navajas. Cada corte, cada barba, hecho con criterio.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 6l8 8-8 8M2 2l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/>
            </svg>`,
    },
    {
      titulo: 'Club Caballero',
      desc: 'Gana puntos en cada visita y canjéalos por cortes, productos y servicios premium.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
    },
  ];

  esSignature(nombre: string): boolean {
    return nombre.toLowerCase().includes('ritual');
  }

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.supa.client
        .from('appsalon_profiles')
        .select('is_admin')
        .eq('id', this.auth.user()?.id ?? '')
        .single()
        .then(({ data }) => this.isAdmin.set(!!data?.is_admin));
    }
    this.cargarServicios();
    this.cargarEquipo();
    this.cargarGaleria();
  }

  private async cargarServicios() {
    const { data } = await this.supa.client
      .from('appsalon_servicios')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: false });
    this.servicios.set((data as Servicio[]) || []);
    this.cargando.set(false);
  }

  private async cargarEquipo() {
    const { data } = await this.supa.client
      .from('appsalon_staff')
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .limit(4);
    this.equipoDestacado.set((data as Staff[]) || []);
  }

  private async cargarGaleria() {
    const { data } = await this.supa.client
      .from('appsalon_galeria')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false })
      .limit(3);
    this.galeria.set((data as Galeria[]) || []);
  }
}
