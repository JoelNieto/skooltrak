# Skooltrak Platform

<p align="center">
  <img src="apps/web-dashboard/public/skooltrak.png" alt="Skooltrak logo" width="160">
  
</p>

Monorepo managed with Nx containing Angular frontends and NestJS GraphQL backends.

## Purpose

Skooltrak is an educational platform for schools to manage academic processes, users, and communication across dashboards and admin tools.

## Apps

- **web-dashboard** — Angular 20 dashboard app
- **dashboard-backend** — NestJS 11 GraphQL API
- **web-admin** — Angular 20 admin app
- **admin-backend** — NestJS 11 GraphQL API

E2E projects are colocated under `apps/*-e2e`.

## Getting started

- **Install dependencies**
  - Using Bun (preferred, bun.lock present):
    ```sh
    bun install
    ```
  - Or npm:
    ```sh
    npm install
    ```
  - Or pnpm:
    ```sh
    pnpm install
    ```

- **Environment**
  - Copy `.env` and set required variables for web and backend apps.

## Development

- **Start Dashboard (web + api)**
  ```sh
  npm run serve:dev
  ```

- **Start Admin (web + api)**
  ```sh
  npm run serve:dev:admin
  ```

- **Serve a single project**
  ```sh
  npx nx serve web-dashboard
  npx nx serve dashboard-backend
  npx nx serve web-admin
  npx nx serve admin-backend
  ```

- **Build**
  ```sh
  npx nx build <project-name>
  ```

- **Project info / graph**
  ```sh
  npx nx show project <project-name>
  npx nx graph
  ```

## Testing & Linting

- **Unit tests (Vitest/Jest as configured by project)**
  ```sh
  npx nx test <project-name>
  ```
- **E2E (Playwright)**
  ```sh
  npx nx e2e <e2e-project>
  ```
- **Lint**
  ```sh
  npx nx lint <project-name>
  ```

## Tech stack

- **Nx 22** for monorepo orchestration
- **Angular 20** for frontends (Vite build via @nx/vite)
- **NestJS 11** for APIs
- **GraphQL 16** with Apollo
- **Prisma 6** for database access
- **Tailwind CSS 4** + **DaisyUI** for styling

## Project structure

- **apps/** — application projects (frontends, backends, e2e)
- **libs/** — shared libraries
- **prisma/** — Prisma schema and assets
- **generated/** — generated artifacts (e.g., Prisma client)

Use `npx nx g` to generate code (apps, libs, components, etc.).

---

## Español

# Plataforma Skooltrak

<p align="center">
  <img src="apps/web-dashboard/public/skooltrak.png" alt="Logo Skooltrak" width="160">
  
</p>

Monorepo gestionado con Nx que contiene frontends en Angular y backends GraphQL en NestJS.

## Propósito

Skooltrak es una plataforma educativa para escuelas que permite gestionar procesos académicos, usuarios y comunicación mediante paneles y herramientas de administración.

## Aplicaciones

- **web-dashboard** — Aplicación Angular 20 (dashboard)
- **dashboard-backend** — API GraphQL con NestJS 11
- **web-admin** — Aplicación Angular 20 (admin)
- **admin-backend** — API GraphQL con NestJS 11

Los proyectos E2E están en `apps/*-e2e`.

## Comenzando

- **Instalar dependencias**
  - Con Bun (preferido, hay bun.lock):
    ```sh
    bun install
    ```
  - O npm:
    ```sh
    npm install
    ```
  - O pnpm:
    ```sh
    pnpm install
    ```

- **Entorno**
  - Copia `.env` y define las variables requeridas para web y backend.

## Desarrollo

- **Iniciar Dashboard (web + api)**
  ```sh
  npm run serve:dev
  ```

- **Iniciar Admin (web + api)**
  ```sh
  npm run serve:dev:admin
  ```

- **Servir un proyecto específico**
  ```sh
  npx nx serve web-dashboard
  npx nx serve dashboard-backend
  npx nx serve web-admin
  npx nx serve admin-backend
  ```

- **Build**
  ```sh
  npx nx build <project-name>
  ```

- **Información / grafo del proyecto**
  ```sh
  npx nx show project <project-name>
  npx nx graph
  ```

## Pruebas y Linting

- **Unitarias (Vitest/Jest según el proyecto)**
  ```sh
  npx nx test <project-name>
  ```
- **E2E (Playwright)**
  ```sh
  npx nx e2e <e2e-project>
  ```
- **Lint**
  ```sh
  npx nx lint <project-name>
  ```

## Tecnologías

- **Nx 22** para orquestación de monorepo
- **Angular 20** para frontends (build con Vite mediante @nx/vite)
- **NestJS 11** para APIs
- **GraphQL 16** con Apollo
- **Prisma 6** para acceso a base de datos
- **Tailwind CSS 4** + **DaisyUI** para estilos

## Estructura del proyecto

- **apps/** — aplicaciones (frontends, backends, e2e)
- **libs/** — librerías compartidas
- **prisma/** — esquema y recursos de Prisma
- **generated/** — artefactos generados (p.ej., Prisma client)

Usa `npx nx g` para generar código (apps, libs, componentes, etc.).
