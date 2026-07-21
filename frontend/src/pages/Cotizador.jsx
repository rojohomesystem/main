import { useEffect, useMemo, useState } from 'react'
import { supabase, TASA_IMPUESTO } from '../lib/supabase.js'
import { SERVICIOS, money } from '../lib/catalogo.js'
import { generarPDF } from '../lib/pdf.js'
import { Plus, Trash2, FileDown, Save, Loader2 } from 'lucide-react'

const filaVacia = () => ({
  descripcion: '', cantidad: 1, unidad: 'unidad', precio_unit: 0,
})

export default function Cotizador() {
  const [clientes, setClientes] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [ubicacionId, setUbicacionId] = useState('')

  const [tipoServicio, setTipoServicio] = useState('Pintura Interior')
  const [notas, setNotas] = useState('Estimado sin costos ocultos. Materiales de primera calidad (Sherwin-Williams).')
  const [descuento, setDescuento] = useState(0)
  const [aplicarImpuesto, setAplicarImpuesto] = useState(true)
  const [filas, setFilas] = useState([filaVacia()])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('id,nombre').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])

  useEffect(() => {
    if (!clienteId) return setUbicaciones([])
    supabase.from('ubicaciones').select('*').eq('cliente_id', clienteId)
      .then(({ data }) => setUbicaciones(data ?? []))
    setUbicacionId('')
  }, [clienteId])

  // ---- Cálculos ----
  const subtotal = useMemo(
    () => filas.reduce((s, f) => s + (Number(f.cantidad) || 0) * (Number(f.precio_unit) || 0), 0),
    [filas]
  )
  const base = Math.max(0, subtotal - (Number(descuento) || 0))
  const impuesto = aplicarImpuesto ? base * TASA_IMPUESTO : 0
  const total = base + impuesto

  // ---- Filas ----
  const setFila = (i, k, v) => setFilas(filas.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)))
  const agregarFila = () => setFilas([...filas, filaVacia()])
  const quitarFila = (i) => setFilas(filas.filter((_, idx) => idx !== i))

  function agregarDelCatalogo(item) {
    setFilas((prev) => {
      // si la primera fila está vacía, reemplázala
      if (prev.length === 1 && !prev[0].descripcion) {
        return [{ ...item, cantidad: 1 }]
      }
      return [...prev, { ...item, cantidad: 1 }]
    })
  }

  const clienteSel = clientes.find((c) => c.id === clienteId)
  const ubicacionSel = ubicaciones.find((u) => u.id === ubicacionId)

  // ---- Numeración COT-AÑO-#### ----
  async function siguienteNumero() {
    const { data } = await supabase.from('contadores').select('valor').eq('clave', 'cotizacion').single()
    const nuevo = (data?.valor ?? 0) + 1
    await supabase.from('contadores').update({ valor: nuevo }).eq('clave', 'cotizacion')
    return `COT-${new Date().getFullYear()}-${String(nuevo).padStart(4, '0')}`
  }

  function armarCotizacion(numero) {
    return {
      numero,
      fecha: new Date().toLocaleDateString('es-US'),
      cliente: clienteSel,
      ubicacion: ubicacionSel,
      tipoServicio,
      notas,
      filas: filas.filter((f) => f.descripcion),
      subtotal, descuento: Number(descuento) || 0, impuesto, total,
    }
  }

  async function descargarPDF() {
    if (!clienteSel) return alert('Selecciona un cliente')
    if (!filas.some((f) => f.descripcion)) return alert('Agrega al menos un renglón')
    const numero = `COT-${new Date().getFullYear()}-BORRADOR`
    generarPDF(armarCotizacion(numero))
  }

  async function guardarYDescargar() {
    if (!clienteSel) return alert('Selecciona un cliente')
    if (!filas.some((f) => f.descripcion)) return alert('Agrega al menos un renglón')
    setGuardando(true)
    try {
      const numero = await siguienteNumero()
      const { data: cot, error } = await supabase.from('cotizaciones').insert({
        cliente_id: clienteId,
        ubicacion_id: ubicacionId || null,
        numero_cotizacion: numero,
        tipo_servicio: tipoServicio,
        notas,
        subtotal, descuento: Number(descuento) || 0, impuesto, total,
        estado: 'enviada',
      }).select().single()
      if (error) throw error

      const items = filas.filter((f) => f.descripcion).map((f) => ({
        cotizacion_id: cot.id,
        descripcion: f.descripcion,
        cantidad: Number(f.cantidad) || 1,
        unidad: f.unidad,
        precio_unit: Number(f.precio_unit) || 0,
        total_linea: (Number(f.cantidad) || 0) * (Number(f.precio_unit) || 0),
      }))
      await supabase.from('cotizacion_items').insert(items)

      generarPDF(armarCotizacion(numero))
      alert('Cotización guardada como ' + numero)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {/* Columna principal */}
      <div className="space-y-6">
        {/* Datos generales */}
        <div className="tarjeta">
          <h2 className="mb-4 text-lg font-bold">Datos de la cotización</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="etiqueta">Cliente</label>
              <select className="campo" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">— Selecciona —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta">Ubicación</label>
              <select className="campo" value={ubicacionId} onChange={(e) => setUbicacionId(e.target.value)} disabled={!clienteId}>
                <option value="">— Opcional —</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>{u.etiqueta || u.direccion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="etiqueta">Tipo de servicio</label>
              <input className="campo" value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} />
            </div>
            <div>
              <label className="etiqueta">Descuento ($)</label>
              <input type="number" step="0.01" className="campo" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="etiqueta">Notas / condiciones</label>
            <textarea className="campo" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        {/* Renglones */}
        <div className="tarjeta">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Renglones</h2>
            <button className="btn-borde !px-3 !py-1.5 text-sm" onClick={agregarFila}>
              <Plus className="h-4 w-4" /> Fila
            </button>
          </div>

          <div className="space-y-2">
            {/* encabezados */}
            <div className="hidden gap-2 px-1 text-xs font-semibold uppercase text-neutral-400 sm:grid sm:grid-cols-[1fr_80px_90px_110px_110px_36px]">
              <span>Descripción</span><span>Cant.</span><span>Unidad</span>
              <span>Precio</span><span className="text-right">Total</span><span></span>
            </div>
            {filas.map((f, i) => {
              const totalLinea = (Number(f.cantidad) || 0) * (Number(f.precio_unit) || 0)
              return (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_80px_90px_110px_110px_36px] sm:items-center">
                  <input className="campo col-span-2 sm:col-span-1" placeholder="Descripción del trabajo"
                    value={f.descripcion} onChange={(e) => setFila(i, 'descripcion', e.target.value)} />
                  <input type="number" step="0.01" className="campo" placeholder="Cant."
                    value={f.cantidad} onChange={(e) => setFila(i, 'cantidad', e.target.value)} />
                  <input className="campo" placeholder="Unidad"
                    value={f.unidad} onChange={(e) => setFila(i, 'unidad', e.target.value)} />
                  <input type="number" step="0.01" className="campo" placeholder="Precio"
                    value={f.precio_unit} onChange={(e) => setFila(i, 'precio_unit', e.target.value)} />
                  <div className="px-1 text-right text-sm font-semibold sm:text-left sm:text-right">
                    {money(totalLinea)}
                  </div>
                  <button onClick={() => quitarFila(i)} className="justify-self-end rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Barra lateral: catálogo + totales + acciones */}
      <div className="space-y-6">
        <div className="tarjeta">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Agregar del catálogo</h3>
          <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
            {SERVICIOS.map((g) => (
              <div key={g.grupo}>
                <p className="mb-1 text-xs font-semibold text-marca-oscuro">{g.grupo}</p>
                <div className="space-y-1">
                  {g.items.map((it) => (
                    <button key={it.descripcion} onClick={() => agregarDelCatalogo(it)}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-50">
                      <span className="truncate">{it.descripcion}</span>
                      <Plus className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tarjeta">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Totales</h3>
          <Linea etiqueta="Subtotal" valor={money(subtotal)} />
          {Number(descuento) > 0 && <Linea etiqueta="Descuento" valor={'– ' + money(descuento)} />}
          <label className="my-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={aplicarImpuesto} onChange={(e) => setAplicarImpuesto(e.target.checked)} />
              Impuesto CT (6.35%)
            </span>
            <span>{money(impuesto)}</span>
          </label>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="font-bold">Total</span>
            <span className="text-xl font-bold text-marca-oscuro">{money(total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button className="btn-marca w-full justify-center" onClick={guardarYDescargar} disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar y generar PDF
          </button>
          <button className="btn-borde w-full justify-center" onClick={descargarPDF}>
            <FileDown className="h-4 w-4" /> Solo PDF (borrador)
          </button>
        </div>
      </div>
    </div>
  )
}

function Linea({ etiqueta, valor }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-neutral-500">{etiqueta}</span>
      <span>{valor}</span>
    </div>
  )
}
