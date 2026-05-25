import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="min-h-screen grid lg:grid-cols-2 bg-app-negro">
      <aside class="hidden lg:flex items-center justify-center bg-cover bg-center relative"
             style="background-image: linear-gradient(rgba(26,27,21,0.78), rgba(26,27,21,0.78)), url('/salon.jpg');">
        <img src="/images/logo.jpg" alt="Mike's Club Barber Shop"
             class="w-72 xl:w-96 drop-shadow-2xl rounded-lg ring-1 ring-app-oro/30" />
      </aside>
      <section class="flex items-center justify-center p-6 lg:p-12 relative">
        <img src="/images/logo.jpg" alt=""
             aria-hidden="true"
             class="absolute right-6 top-6 w-12 h-12 rounded-md object-contain ring-1 ring-app-oro/40 bg-app-negro lg:hidden" />
        <div class="w-full max-w-md">
          <router-outlet></router-outlet>
        </div>
      </section>
    </main>
  `,
})
export class AuthLayoutComponent {}
