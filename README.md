# Fixpert-AI 🛠️🤖

Aplicación Web Progresiva (PWA) impulsada por Inteligencia Artificial (Google Gemini + YouTube Data API v3) para diagnosticar reparaciones del hogar y armado de muebles mediante fotos y texto.

## Arquitectura del Monorepositorio

- **`/apps/web`**: Frontend en React 18, Vite, Tailwind CSS, Vite PWA Plugin, React Query (`@tanstack/react-query`), `react-i18next`, Vitest y React Testing Library.
- **`/apps/api`**: Backend en NestJS, Multer (`multipart/form-data`), Google Gemini SDK (`@google/generative-ai`), YouTube Data API v3, Prisma ORM, Jest y Supertest.
- **Base de Datos**: PostgreSQL 15 (`docker-compose.yml`).

---

## Desarrollo Local

1. **Variables de Entorno:**
   Copia `.env.example` a `apps/api/.env` y `apps/web/.env` y configura tus claves:
   ```bash
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env
   ```

2. **Levantar PostgreSQL con Docker:**
   ```bash
   npm run db:up
   ```

3. **Generar cliente Prisma y sincronizar esquema:**
   ```bash
   npm run db:generate
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   # Terminal 1 - Backend API (http://localhost:3000)
   npm run dev:api

   # Terminal 2 - Frontend PWA (http://localhost:5173)
   npm run dev:web
   ```

5. **Ejecutar Pruebas Unitarias (Jest + Vitest):**
   ```bash
   npm test
   ```

---

## Despliegue en Railway (Config-as-Code Lista)

El repositorio ya incluye [`apps/api/railway.json`](./apps/api/railway.json) y [`apps/web/railway.json`](./apps/web/railway.json) preconfigurados.

1. En **Railway**, crea un nuevo proyecto con **Provision PostgreSQL**.
2. Crea el servicio **Backend (`fixpert-api`)** conectado a este repositorio:
   - En **Settings -> Root Directory**, escribe: `/apps/api` (Railway detectará automáticamente `apps/api/railway.json`).
   - En **Variables**, añade:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     - `GEMINI_API_KEY`: Tu API Key de Google Gemini
     - `YOUTUBE_API_KEY`: Tu API Key de YouTube Data v3
   - En **Networking**, haz clic en **Generate Domain**.
3. Crea el servicio **Frontend (`fixpert-web`)** conectado a este mismo repositorio:
   - En **Settings -> Root Directory**, escribe: `/apps/web` (Railway detectará automáticamente `apps/web/railway.json`).
   - En **Variables**, añade:
     - `VITE_API_URL`: La URL pública generada para `fixpert-api`.
   - En **Networking**, haz clic en **Generate Domain**.
