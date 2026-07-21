# CLAUDE.md — Contexto del proyecto

Este archivo le da contexto a Claude Code cuando trabajes en este repo.

## Qué es

Sistema interno para **Rojo Home Improvement** (Wilson Rojo, Norwalk, CT),
empresa de pintura y remodelación. Herramienta de un solo usuario (el dueño).

## Objetivo funcional

Tres secciones:
1. **Clientes** — crear clientes y sus ubicaciones.
2. **Facturas** — subir foto de un recibo → un backend de Python la lee con la
   visión de Claude → se revisan/corrigen los datos → se guardan en Supabase.
3. **Cotizador** — armar una cotización con el catálogo de servicios y generar un PDF.

## Stack

- **Frontend:** React 18 + Vite + Tailwind (carpeta `frontend/`). Dev server en el **puerto 3003**.
- **Backend:** Python + FastAPI (carpeta `backend/`), endpoint `POST /extract`. Puerto **8000**.
- **DB + Storage:** Supabase (esquema en `supabase/schema.sql`).
- **Hosting frontend:** Netlify. El backend de Python va aparte (local o Render/Railway).

## Convenciones

- **Idioma:** todo en **español** (UI, comentarios, nombres de columnas).
- **Colores de marca:** amarillo `#F5B301` (clase `marca`), tinta `#1C1B1A` (clase `tinta`). Ver `tailwind.config.js`.
- **Moneda:** USD. **Impuesto:** Connecticut 6.35% (`TASA_IMPUESTO` en `src/lib/supabase.js`).
- Estilos reutilizables en `src/index.css`: `.btn-marca`, `.btn-borde`, `.campo`, `.tarjeta`, `.etiqueta`.
- Formato de dinero/fecha: helpers `money()` y `fecha()` en `src/lib/catalogo.js`.

## Archivos clave

| Archivo | Rol |
|---|---|
| `frontend/src/pages/Clientes.jsx` | CRUD de clientes y ubicaciones |
| `frontend/src/pages/Facturas.jsx` | Subida de foto, extracción y tabla de gastos |
| `frontend/src/pages/Cotizador.jsx` | Armado de la cotización y totales |
| `frontend/src/lib/pdf.js` | Genera el PDF de la cotización (jsPDF) |
| `frontend/src/lib/catalogo.js` | Catálogo de servicios y precios base |
| `frontend/src/lib/supabase.js` | Cliente de Supabase + constantes |
| `backend/main.py` | Extractor de facturas (FastAPI + visión de Claude) |
| `supabase/schema.sql` | Tablas, storage y políticas |

## Tablas de Supabase

`clientes`, `ubicaciones`, `facturas`, `factura_items`, `cotizaciones`,
`cotizacion_items`, `contadores`. Bucket de Storage: `facturas`.

## Reglas al programar aquí

- Mantén el español y los estilos/clases ya definidos.
- No rompas los nombres de columnas del esquema (o actualiza `schema.sql` a la par).
- El backend debe seguir devolviendo el JSON con las claves que espera
  `Facturas.jsx` (`proveedor`, `fecha_factura`, `numero_factura`, `subtotal`,
  `impuesto`, `total`, `categoria`, `items[]`).
- Antes de dar por terminado: `npm run dev` en `frontend/` no debe tener errores.

## Pendientes / ideas

- Login con Supabase Auth (un solo dueño).
- Reporte mensual de gastos por cliente.
- Guardar el PDF de la cotización en Storage y listar cotizaciones anteriores.
