// ============================================================
//  Catálogo de servicios de Rojo Home Improvement
//  Precios BASE de ejemplo — Wilson debe ajustarlos a su realidad.
//  Se usan para pre-llenar renglones en el cotizador.
// ============================================================

export const SERVICIOS = [
  {
    grupo: 'Pintura',
    items: [
      { descripcion: 'Pintura interior (paredes)', unidad: 'pie²', precio_unit: 2.5 },
      { descripcion: 'Pintura interior (techos)', unidad: 'pie²', precio_unit: 2.0 },
      { descripcion: 'Pintura exterior', unidad: 'pie²', precio_unit: 3.25 },
      { descripcion: 'Pintura de molduras / trim', unidad: 'pie lineal', precio_unit: 3.0 },
      { descripcion: 'Pintura de puertas', unidad: 'unidad', precio_unit: 85 },
      { descripcion: 'Preparación y sellado de superficie', unidad: 'pie²', precio_unit: 1.25 },
    ],
  },
  {
    grupo: 'Wallpaper',
    items: [
      { descripcion: 'Remoción de wallpaper', unidad: 'pie²', precio_unit: 2.0 },
      { descripcion: 'Instalación de wallpaper', unidad: 'pie²', precio_unit: 3.5 },
    ],
  },
  {
    grupo: 'Remodelación',
    items: [
      { descripcion: 'Remodelación de cocina', unidad: 'proyecto', precio_unit: 0 },
      { descripcion: 'Remodelación de baño', unidad: 'proyecto', precio_unit: 0 },
      { descripcion: 'Carpintería / molduras', unidad: 'pie lineal', precio_unit: 12 },
    ],
  },
  {
    grupo: 'Pisos',
    items: [
      { descripcion: 'Restauración de piso de madera', unidad: 'pie²', precio_unit: 4.5 },
      { descripcion: 'Mantenimiento de piso', unidad: 'pie²', precio_unit: 2.0 },
    ],
  },
  {
    grupo: 'Handyman',
    items: [
      { descripcion: 'Mano de obra general (handyman)', unidad: 'hora', precio_unit: 65 },
      { descripcion: 'Reparación de drywall', unidad: 'unidad', precio_unit: 120 },
    ],
  },
  {
    grupo: 'Materiales',
    items: [
      { descripcion: 'Galón de pintura Sherwin-Williams', unidad: 'galón', precio_unit: 55 },
      { descripcion: 'Materiales y consumibles', unidad: 'global', precio_unit: 0 },
    ],
  },
]

// Categorías para clasificar facturas de gasto
export const CATEGORIAS_GASTO = [
  'Pintura',
  'Materiales',
  'Herramientas',
  'Wallpaper',
  'Pisos',
  'Carpintería',
  'Transporte / Gasolina',
  'Renta de equipo',
  'Otro',
]

// -------- Utilidades de formato --------
export const money = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(n) || 0)

export const fecha = (d) =>
  d ? new Date(d).toLocaleDateString('es-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
