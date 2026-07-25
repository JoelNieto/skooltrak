import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-choose-path',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-5xl text-primary">route</span>
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">¿Qué deseas hacer?</h1>
            <p class="text-base-content/70">Elige cómo deseas usar Skooltrak</p>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Create School -->
            <a
              routerLink="/onboarding/create-school"
              class="card bg-base-100 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-base-200 hover:border-primary"
            >
              <div class="card-body items-center text-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-4xl text-primary">add_business</span>
                </div>
                <h2 class="card-title">Crear una Escuela</h2>
                <p class="text-base-content/60 text-sm">
                  Registra tu institución educativa y configura cursos, grados y grupos.
                </p>
                <div class="badge badge-primary badge-outline">Administrador</div>
              </div>
            </a>

            <!-- Join School -->
            <a
              routerLink="/onboarding/join-school"
              class="card bg-base-100 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-base-200 hover:border-secondary"
            >
              <div class="card-body items-center text-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-4xl text-secondary">group_add</span>
                </div>
                <h2 class="card-title">Unirse a una Escuela</h2>
                <p class="text-base-content/60 text-sm">
                  Busca tu escuela y únete como docente, estudiante o padre de familia.
                </p>
                <div class="badge badge-secondary badge-outline">Docente / Estudiante / Padre</div>
              </div>
            </a>
          </div>
        </div>
      </main>

      <footer class="p-4 md:p-6 flex justify-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm">
        <p class="text-sm text-base-content/60">
          ¿Necesitas ayuda?
          <a href="mailto:soporte@skooltrak.com" class="link link-primary">Contactar soporte</a>
        </p>
      </footer>
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export default class ChoosePath {}
