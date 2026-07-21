import { createClient } from '@supabase/supabase-js'

// Estas variables vienen de frontend/.env  (ver .env.example)
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn(
    '⚠️  Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en frontend/.env'
  )
}

export const supabase = createClient(url ?? '', key ?? '')

// URL del backend de Python (extractor de facturas)
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

// Impuesto de venta de Connecticut (6.35%). Ajústalo si cambia.
export const TASA_IMPUESTO = 0.0635
