# Quiniela Mundial 2026

Aplicación Next.js App Router + TypeScript estricto para una quiniela del Mundial 2026 desde dieciseisavos hasta final y tercer puesto. Incluye UI responsive, reglas de puntuación, SQL Supabase con RLS, ranking público seguro, panel administrativo, Edge Function de sincronización y pruebas.

## Variables
Copiar `.env.example` a `.env.local` y configurar: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_API_KEY`, `FOOTBALL_API_BASE_URL`, `FOOTBALL_LEAGUE_ID`, `FOOTBALL_SEASON`, `SYNC_SECRET`, `ADMIN_EMAILS`.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_API_KEY` ni `SYNC_SECRET` en el navegador.

## Desarrollo
```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Sin credenciales reales, la interfaz compila y usa datos demo locales solo para desarrollo; en producción configura Supabase.

## Supabase
1. Crear un proyecto en Supabase.
2. Copiar Project URL y anon key a `.env.local`.
3. Ejecutar `supabase/migrations/001_init.sql` y luego `002_seed.sql` en SQL Editor o CLI.
4. Activar Auth por correo/contraseña.
5. Configurar URL del sitio y redirects: `http://localhost:3000/auth/callback`, tu dominio Vercel y `/completar-perfil`.
6. Crear el primer administrador: registra un usuario y ejecuta `update profiles set role='admin' where email='TU_CORREO';`.
7. Verificar que `public_leaderboard()` no expone apellido, correo, UUID ni rol.

## Google OAuth
1. En Google Cloud crea OAuth Client Web.
2. Agrega redirect de Supabase: `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. Copia Client ID/Secret en Supabase Auth Providers > Google.
4. Actualiza authorized domains al cambiar dominio en Vercel.

## Vercel
1. Importar repositorio.
2. Framework: Next.js; package manager: pnpm.
3. Agregar variables de entorno.
4. Deploy.
5. Añadir dominio personalizado.
6. Actualizar `NEXT_PUBLIC_SITE_URL`, redirects de Supabase y Google OAuth.

## Modo manual
En `/admin`, un administrador puede editar partidos, equipos, horarios, bloqueo, estado y resultados. Al registrar un resultado final se deben recalcular puntos mediante funciones SQL/acciones servidor. El diseño evita depender de API externa.

## API externa y sincronización
La Edge Function `sync-world-cup-fixtures` valida `SYNC_SECRET`, consulta `FOOTBALL_API_BASE_URL`, valida con Zod y tolera `FOOTBALL_API_KEY` vacío devolviendo advertencia. Cron se documenta en `supabase/cron/manage_sync.sql`.

## Arquitectura
- `src/app`: páginas App Router.
- `src/components`: navegación y tarjetas de partido.
- `src/lib/scoring.ts`: cálculo puro de puntos, cierre y validaciones.
- `src/lib/leaderboard.ts`: ranking de competición y salida pública.
- `src/lib/bracket.ts`: propagación de ganador/perdedor.
- `supabase/migrations`: esquema, RLS, funciones y seeds.
- `supabase/functions`: sincronización desacoplada.
- `tests`: Vitest y Playwright.

## Limitaciones de esta primera versión
La versión es funcional como primera entrega compilable y lista para conectar a Supabase. Algunas mutaciones de UI están en modo demo hasta colocar credenciales y conectar Server Actions completas contra la base. El modo manual, RLS, triggers, ranking y Edge Function quedan preparados en SQL/servidor.
