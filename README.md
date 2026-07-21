# 🎨 Rojo Home Improvement — Sistema de gestión

Sistema interno para **Wilson Rojo** (Rojo Home Improvement, Norwalk, CT).
Permite manejar clientes, registrar gastos por foto y generar cotizaciones.

## ¿Qué hace?

1. **Clientes** — crear clientes y sus ubicaciones (propiedades) con datos básicos.
2. **Facturas** — subir la foto de un recibo; Python lee la imagen y extrae
   proveedor, fecha, montos y renglones, y los guarda en una tabla con el total gastado.
3. **Cotizador** — elegir cliente, servicios y cantidades, ver el total en vivo y
   generar un **PDF de cotización** con la marca de la empresa.

## Arquitectura

```
┌────────────────────┐        ┌─────────────────────┐        ┌──────────────────┐
│  Frontend (React)  │  HTTP  │  Backend (Python)   │  API   │  Claude (visión) │
│  localhost:3003    │───────▶│  FastAPI :8000      │───────▶│  lee la factura  │
│  Netlify (prod)    │        │  /extract           │        └──────────────────┘
└─────────┬──────────┘        └─────────────────────┘
          │
          │ guarda datos + fotos
          ▼
   ┌───────────────┐
   │   Supabase    │  (Postgres + Storage)
   └───────────────┘
```

- **Frontend:** React + Vite + Tailwind → se ve en `localhost:3003`, se publica en **Netlify**.
- **Base de datos + fotos:** **Supabase** (Postgres + Storage).
- **Extractor de facturas:** **Python** (FastAPI) usando la visión de Claude.

## Puesta en marcha (resumen)

Los pasos detallados y los comandos exactos están en **[COMANDOS.md](./COMANDOS.md)**.

1. **Supabase:** crea un proyecto, entra al *SQL Editor* y ejecuta
   [`supabase/schema.sql`](./supabase/schema.sql). Copia tu URL y la *anon key*.
2. **Frontend:** en `frontend/`, `npm install`, crea `.env` (desde `.env.example`) y `npm run dev`.
3. **Backend:** en `backend/`, crea el entorno, `pip install -r requirements.txt` y `uvicorn main:app --reload --port 8000`.

## Estructura del proyecto

```
Rojo Home Improvement/
├── COMANDOS.md            ← comandos de terminal (empieza por aquí)
├── CLAUDE.md              ← contexto para trabajar con Claude Code
├── netlify.toml          ← configuración de despliegue del frontend
├── supabase/
│   └── schema.sql         ← todas las tablas + storage + permisos
├── frontend/              ← la app que ve el dueño (React/Vite → :3003)
│   └── src/
│       ├── pages/         ← Clientes, Facturas, Cotizador
│       └── lib/           ← supabase, catálogo de servicios, generador de PDF
└── backend/               ← extractor de facturas (Python/FastAPI → :8000)
    └── main.py
```

## Nota sobre el despliegue (Netlify + Python)

Netlify publica muy bien el **frontend**, pero **no corre el backend de Python**
de forma estándar. Tienes dos caminos:

- **Recomendado para empezar:** corre el backend de Python en la computadora del dueño
  (localhost:8000). La página funciona igual desde su equipo.
- **Cuando quieras que funcione en línea:** publica el `backend/` en un servicio que
  sí corre Python (Render, Railway o Fly.io) y pon esa URL en `VITE_BACKEND_URL`.

## Siguientes pasos sugeridos

- Agregar login (Supabase Auth) para que solo el dueño entre.
- Reporte mensual de gastos por cliente.
- Guardar el PDF de la cotización también en Supabase Storage.
- Ajustar el catálogo de precios en `frontend/src/lib/catalogo.js`.
