-- ============================================================
--  ROJO HOME IMPROVEMENT — Esquema de base de datos (Supabase)
-- ============================================================
--  Cómo usarlo:
--  1. Entra a tu proyecto en https://supabase.com
--  2. Ve a: SQL Editor -> New query
--  3. Pega TODO este archivo y presiona "Run"
--  Esto crea las tablas, el bucket de imágenes y las políticas.
-- ============================================================

-- ------------------------------------------------------------
-- 1) CLIENTES
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  email       text,
  telefono    text,
  empresa     text,               -- por si el cliente es una empresa
  notas       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) UBICACIONES (los lugares donde se encuentra cada cliente)
--    Un cliente puede tener varias ubicaciones / propiedades.
-- ------------------------------------------------------------
create table if not exists public.ubicaciones (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clientes(id) on delete cascade,
  etiqueta      text,             -- ej: "Casa principal", "Apartamento", "Oficina"
  direccion     text,
  ciudad        text default 'Norwalk',
  estado        text default 'CT',
  codigo_postal text,
  notas         text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) FACTURAS (los gastos / costos, capturados por foto)
--    datos_extraidos guarda el JSON crudo que devuelve el OCR.
-- ------------------------------------------------------------
create table if not exists public.facturas (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references public.clientes(id) on delete set null,
  ubicacion_id    uuid references public.ubicaciones(id) on delete set null,
  proveedor       text,           -- ej: "Sherwin-Williams", "Home Depot"
  fecha_factura   date,
  numero_factura  text,
  subtotal        numeric(12,2) default 0,
  impuesto        numeric(12,2) default 0,
  total           numeric(12,2) default 0,
  moneda          text default 'USD',
  categoria       text,           -- ej: "Pintura", "Materiales", "Herramientas"
  imagen_url      text,           -- ruta en Supabase Storage
  datos_extraidos jsonb,          -- respuesta completa del extractor Python
  estado          text default 'revisado',   -- 'pendiente' | 'revisado'
  created_at      timestamptz not null default now()
);

-- Renglones de la factura (line items)
create table if not exists public.factura_items (
  id            uuid primary key default gen_random_uuid(),
  factura_id    uuid not null references public.facturas(id) on delete cascade,
  descripcion   text,
  cantidad      numeric(12,2) default 1,
  precio_unit   numeric(12,2) default 0,
  total_linea   numeric(12,2) default 0
);

-- ------------------------------------------------------------
-- 4) COTIZACIONES
-- ------------------------------------------------------------
create table if not exists public.cotizaciones (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid references public.clientes(id) on delete set null,
  ubicacion_id       uuid references public.ubicaciones(id) on delete set null,
  numero_cotizacion  text,        -- ej: "COT-2026-0001"
  fecha              date default current_date,
  valida_hasta       date,
  tipo_servicio      text,        -- ej: "Pintura Interior"
  notas              text,
  subtotal           numeric(12,2) default 0,
  descuento          numeric(12,2) default 0,
  impuesto           numeric(12,2) default 0,
  total              numeric(12,2) default 0,
  estado             text default 'borrador',  -- 'borrador' | 'enviada' | 'aceptada' | 'rechazada'
  created_at         timestamptz not null default now()
);

create table if not exists public.cotizacion_items (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  descripcion     text,
  cantidad        numeric(12,2) default 1,
  unidad          text default 'unidad',   -- ej: "pie²", "hora", "galón"
  precio_unit     numeric(12,2) default 0,
  total_linea     numeric(12,2) default 0
);

-- Contador para numerar cotizaciones automáticamente (COT-AÑO-####)
create table if not exists public.contadores (
  clave  text primary key,
  valor  int not null default 0
);
insert into public.contadores (clave, valor)
values ('cotizacion', 0)
on conflict (clave) do nothing;

-- ------------------------------------------------------------
-- 5) STORAGE — bucket para las fotos de las facturas
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6) SEGURIDAD (RLS)
--    Sistema de un solo dueño: permitimos todo a usuarios
--    autenticados. Cuando agregues login, esto ya funciona.
--    Para pruebas rápidas SIN login, ver la nota al final.
-- ------------------------------------------------------------
alter table public.clientes          enable row level security;
alter table public.ubicaciones       enable row level security;
alter table public.facturas          enable row level security;
alter table public.factura_items     enable row level security;
alter table public.cotizaciones      enable row level security;
alter table public.cotizacion_items  enable row level security;
alter table public.contadores        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'clientes','ubicaciones','facturas','factura_items',
    'cotizaciones','cotizacion_items','contadores'
  ]
  loop
    execute format(
      'drop policy if exists "acceso_autenticado" on public.%I;', t);
    execute format(
      'create policy "acceso_autenticado" on public.%I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Políticas de Storage: usuarios autenticados suben/ven/borran facturas
drop policy if exists "facturas_select" on storage.objects;
create policy "facturas_select" on storage.objects
  for select to authenticated using (bucket_id = 'facturas');

drop policy if exists "facturas_insert" on storage.objects;
create policy "facturas_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'facturas');

drop policy if exists "facturas_delete" on storage.objects;
create policy "facturas_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'facturas');

-- ============================================================
--  NOTA PARA PRUEBAS RÁPIDAS SIN LOGIN
--  ----------------------------------------------------------
--  Si todavía no configuras el login y quieres probar de una,
--  cambia "to authenticated" por "to anon, authenticated" en
--  las políticas de arriba (o desactiva RLS temporalmente con:
--    alter table public.clientes disable row level security;
--  ...). Recuerda volver a activarlo antes de publicar.
-- ============================================================
