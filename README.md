# Mejoras — Control de Calidad de Documentos

Aplicación interna para registrar y hacer seguimiento de errores detectados en documentos (reportes, tablas, formularios). Claude analiza una imagen del documento y detecta automáticamente el error más relevante. El equipo comparte una vista unificada de todos los registros.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS v3 (paleta personalizada: cream / navy / coral) |
| Base de datos y Auth | Supabase (PostgreSQL + Storage + Auth) |
| IA | Claude Sonnet 4.6 via API de Anthropic |
| Hosting | Netlify (deploy estático) |
| Fuente | Sora (Google Fonts) |

---

## Funcionalidades

- Autenticación con Google OAuth o correo + contraseña
- El nombre y foto de perfil de Google se muestran en el header y en la tabla
- Subida de imagen de un documento → Claude detecta el error principal automáticamente
- Formulario para completar: estado, responsable (por correo), nota
- Al escribir el correo del responsable, se muestra su nombre si ya tiene cuenta en la app
- Tabla compartida: todos los usuarios ven todos los registros del equipo
- Edición inline de estado, responsable y nota haciendo clic en la celda
- Filtros por estado (Pendiente, En Progreso, Completado, Cancelado)
- Vista ampliada de imagen al hacer clic en el thumbnail
- Eliminación con confirmación

---

## Estructura del proyecto

```
src/
├── components/
│   ├── auth/
│   │   └── AuthPage.tsx          # Login / registro con email o Google
│   ├── layout/
│   │   └── Header.tsx            # Barra superior con foto y nombre del usuario
│   ├── setup/
│   │   └── ApiKeySetup.tsx       # (componente auxiliar, no se usa en el flujo principal)
│   └── tracker/
│       ├── DeleteModal.tsx       # Modal de confirmacion de eliminacion
│       ├── ImageModal.tsx        # Vista ampliada de imagen
│       ├── MejoraForm.tsx        # Formulario de nueva mejora
│       ├── MejorasTable.tsx      # Tabla principal con edicion inline
│       ├── StatusBadge.tsx       # Chip de color para el estado
│       └── UploadZone.tsx        # Zona de arrastre/seleccion de imagen
├── lib/
│   ├── claude.ts                 # Llamadas a la API de Claude (analisis + verificacion)
│   └── supabase.ts               # Cliente de Supabase
├── pages/
│   └── TrackerPage.tsx           # Pagina principal: carga datos, orquesta el flujo
├── types/
│   └── index.ts                  # Tipos TypeScript compartidos
├── App.tsx                       # Raiz: maneja sesion y renderiza Auth o App
├── main.tsx                      # Punto de entrada React
└── vite-env.d.ts                 # Tipos de variables de entorno
```

---

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto (nunca lo subas a git):

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-legacy-jwt>
VITE_CLAUDE_API_KEY=sk-ant-api03-...
```

### Como obtener cada valor

**VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY**
1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Project Settings → API**
3. Copia la URL del proyecto
4. En la seccion **Legacy API Keys**, copia la `anon` key (empieza con `eyJ...`)

> La key que empieza con `sb_publishable_` NO funciona en este proyecto.

**VITE_CLAUDE_API_KEY**
1. Abre [console.anthropic.com](https://console.anthropic.com)
2. Ve a **API Keys** y asegurate de estar en el workspace **Default**
3. Crea una nueva key (empieza con `sk-ant-api03-`)

---

## Configuracion en Supabase

### 1. Tabla `profiles`

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  api_key     text,
  avatar_url  text
);
```

### 2. Tabla `mejoras`

```sql
create table public.mejoras (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  titulo      text not null,
  usuario     text not null default '',
  responsable text not null default '',
  estado      text not null default 'Pendiente',
  nota        text not null default '',
  imagen_url  text,
  fecha       timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
```

### 3. Storage bucket

- Nombre: `mejoras-images`
- Tipo: **Public** (para que las URLs de imagen sean accesibles sin autenticacion)

Politica de storage para que los usuarios autenticados puedan subir:

```sql
-- INSERT
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mejoras-images');

-- SELECT
create policy "Public read mejoras-images"
  on storage.objects for select
  to public
  using (bucket_id = 'mejoras-images');

-- DELETE
create policy "Authenticated users can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'mejoras-images');
```

### 4. Row Level Security (RLS)

Activa RLS en ambas tablas y crea estas politicas:

**Tabla `mejoras` — politica unica para todas las operaciones:**

```sql
alter table public.mejoras enable row level security;

create policy "Authenticated users access all mejoras"
  on public.mejoras
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
```

**Tabla `profiles` — SELECT para todos, escritura solo del propio perfil:**

```sql
alter table public.profiles enable row level security;

-- Cualquier usuario autenticado puede leer todos los perfiles
-- (necesario para el lookup de responsable por correo)
create policy "Authenticated users can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null);

-- Solo puedes escribir/actualizar tu propio perfil
create policy "Users manage own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);
```

### 5. Autenticacion con Google OAuth

En Supabase: **Authentication → Providers → Google**

- Activa el provider
- Pega el **Client ID** y **Client Secret** de Google Cloud Console
- La **Authorized redirect URI** que debes configurar en Google es:
  ```
  https://<tu-proyecto>.supabase.co/auth/v1/callback
  ```

En Google Cloud Console:
1. Crea un proyecto en [console.cloud.google.com](https://console.cloud.google.com)
2. Habilita la **Google+ API** u **OAuth consent screen**
3. Ve a **Credentials → Create credentials → OAuth 2.0 Client ID**
4. Tipo: **Web application**
5. En **Authorized redirect URIs** agrega la URL de Supabase mencionada arriba
6. Descarga el JSON y copia `client_id` y `client_secret` a Supabase

### 6. URL de redireccion (importante para produccion)

En Supabase: **Authentication → URL Configuration**

- **Site URL**: `https://tu-sitio.netlify.app` (o tu dominio)
- **Redirect URLs**: agrega tambien `http://localhost:5173` para desarrollo local

---

## Desarrollo local

```bash
# 1. Clona el repositorio
git clone https://github.com/dpolo-olo/mejoras-tracker.git
cd mejoras-tracker

# 2. Instala dependencias
npm install

# 3. Crea el archivo de variables de entorno
cp .env.example .env
# (edita .env con tus valores reales)

# 4. Inicia el servidor de desarrollo
npm run dev
# Disponible en http://localhost:5173
```

---

## Deploy en Netlify

El proyecto se despliega automaticamente desde GitHub cuando hay un push a `master`.

**Configuracion manual (primera vez):**

1. Conecta el repositorio en [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. En **Environment variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLAUDE_API_KEY`
5. Despliega

El archivo `netlify.toml` ya incluye la configuracion de build y el redirect necesario para que React Router funcione correctamente:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> Cada vez que cambies variables de entorno en Netlify, haz **"Clear cache and deploy site"** para que los cambios tomen efecto.

---

## Flujo de uso

```
Usuario abre la app
  └── No autenticado → AuthPage (login con email o Google)
  └── Autenticado → Header + TrackerPage

TrackerPage
  ├── Carga todas las mejoras del equipo (sin filtro por usuario)
  ├── Carga perfiles para lookup de responsable
  └── Sección "Nueva mejora"
        1. Usuario arrastra/selecciona una imagen del documento
        2. Claude Sonnet 4.6 analiza la imagen y devuelve el error detectado (max 10 palabras)
        3. Se muestra el formulario con:
           - Titulo (pre-llenado por Claude, no editable)
           - Estado (select: Pendiente / En Progreso / Completado / Cancelado)
           - Responsable (campo email — si coincide con un perfil, muestra el nombre)
           - Nota (texto libre)
           - Usuario → se llena AUTOMATICAMENTE con el nombre del usuario logueado
        4. Al guardar:
           - La imagen se sube a Supabase Storage (bucket mejoras-images)
           - Se inserta el registro en la tabla mejoras
           - La tabla se refresca
```

---

## Comportamiento de la tabla

- Todos los usuarios ven todos los registros del equipo
- Las columnas **Estado**, **Responsable** y **Nota** son editables inline (clic en la celda)
- La columna **Registrado por** es de solo lectura (muestra foto + nombre del creador)
- Los filtros por estado actualizan la vista en tiempo real sin recargar

---

## Modelo de IA

| Uso | Modelo | Tokens |
|-----|--------|--------|
| Analisis de imagen del documento | `claude-sonnet-4-6` | max 150 |
| Verificacion de API key | `claude-haiku-4-5-20251001` | max 5 |

El prompt instruye a Claude a detectar **unicamente errores estructurales o de integridad de datos**, priorizando: nombres repetidos, campos vacios, filas incompletas, datos duplicados. Responde con un titulo de maximo 10 palabras.

---

## Seguridad

- La API key de Claude se almacena como variable de entorno en Netlify, nunca en el repositorio
- El `.env` local esta en `.gitignore`
- Las llamadas a la API de Claude se hacen directamente desde el navegador usando el header `anthropic-dangerous-direct-browser-access: true` (aceptable para uso interno con usuarios de confianza)
- Supabase maneja toda la autenticacion; el frontend solo usa la `anon key` publica
- RLS garantiza que solo usuarios autenticados puedan leer o escribir datos

---

## Licencia

Uso interno — O Logistics.
