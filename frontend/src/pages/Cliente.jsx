import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, BACKEND_URL } from '../lib/supabase.js'
import { CATEGORIAS_GASTO, money, fecha } from '../lib/catalogo.js'
import { Camera, Upload, Loader2, Save, Trash2, MapPin, ArrowLeft, Plus } from 'lucide-react'
import { FormularioUbicacion } from './Clientes.jsx'

export default function Cliente() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [ubicaciones, setUbicaciones] = useState([])
  const [facturas, setFacturas] = useState([])
  const [modalUbicacion, setModalUbicacion] = useState(false)

  // Extracción de facturas
  const inputCamara = useRef(null)
  const inputArchivo = useRef(null)
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [extrayendo, setExtrayendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  async function cargarCliente() {
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
    setCliente(data ?? null)
  }

  async function cargarUbicaciones() {
    const { data } = await supabase
      .from('ubicaciones')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: true })
    setUbicaciones(data ?? [])
  }

  async function cargarFacturas() {
    const { data } = await supabase
      .from('facturas')
      .select('*')
      .eq('cliente_id', id)
      .order('fecha_factura', { ascending: false })
    setFacturas(data ?? [])
  }

  useEffect(() => {
    cargarCliente()
    cargarUbicaciones()
    cargarFacturas()
  }, [id])

  const totalGastado = facturas.reduce((s, f) => s + Number(f.total || 0), 0)
  const direccion = ubicaciones[0]?.direccion

  // ---- Elegir foto: muestra preview y extrae de una vez ----
  function elegirArchivo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
    setDatos(null)
    setError('')
    extraer(file)
  }

  // ---- Enviar la foto al backend de Python para extraer datos ----
  async function extraer(file) {
    setExtrayendo(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${BACKEND_URL}/extract`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
      const json = await res.json()
      setDatos({
        proveedor: json.proveedor ?? '',
        fecha_factura: json.fecha_factura ?? '',
        numero_factura: json.numero_factura ?? '',
        subtotal: json.subtotal ?? 0,
        impuesto: json.impuesto ?? 0,
        total: json.total ?? 0,
        categoria: json.categoria ?? 'Materiales',
        items: json.items ?? [],
        _raw: json,
      })
    } catch (e) {
      setError(
        'No se pudo leer el recibo. ¿Está corriendo el extractor de Python en ' +
        BACKEND_URL + '? (' + e.message + ')'
      )
    } finally {
      setExtrayendo(false)
    }
  }

  const setCampo = (k) => (e) => setDatos({ ...datos, [k]: e.target.value })

  // ---- Guardar: imagen a Storage + registro a la base ----
  async function guardar() {
    if (!datos) return
    setGuardando(true); setError('')
    try {
      // 1) Subir imagen a Storage
      let imagen_url = null
      if (archivo) {
        const ext = archivo.name.split('.').pop()
        const ruta = `${id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('facturas')
          .upload(ruta, archivo, { upsert: false })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('facturas').getPublicUrl(ruta)
        imagen_url = pub.publicUrl
      }

      // 2) Insertar factura
      const { data: fac, error: insErr } = await supabase
        .from('facturas')
        .insert({
          cliente_id: id,
          proveedor: datos.proveedor,
          fecha_factura: datos.fecha_factura || null,
          numero_factura: datos.numero_factura,
          subtotal: Number(datos.subtotal) || 0,
          impuesto: Number(datos.impuesto) || 0,
          total: Number(datos.total) || 0,
          categoria: datos.categoria,
          imagen_url,
          datos_extraidos: datos._raw ?? datos,
        })
        .select()
        .single()
      if (insErr) throw insErr

      // 3) Insertar renglones (si hay)
      if (datos.items?.length) {
        const items = datos.items.map((it) => ({
          factura_id: fac.id,
          descripcion: it.descripcion ?? '',
          cantidad: Number(it.cantidad) || 1,
          precio_unit: Number(it.precio_unit) || 0,
          total_linea: Number(it.total_linea) || 0,
        }))
        await supabase.from('factura_items').insert(items)
      }

      // limpiar
      setArchivo(null); setPreview(null); setDatos(null)
      cargarFacturas()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarFactura(fid) {
    if (!confirm('¿Eliminar esta factura?')) return
    await supabase.from('facturas').delete().eq('id', fid)
    cargarFacturas()
  }

  if (!cliente) return <p className="text-neutral-400">Cargando…</p>

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <Link
          to="/clientes"
          className="inline-flex items-center gap-1 text-neutral-500 transition hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" /> Mis clientes
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{cliente.nombre}</h1>
        {direccion && (
          <p className="mt-1 flex items-center gap-2 text-neutral-500">
            <MapPin className="h-5 w-5 text-marca-oscuro" /> {direccion}
          </p>
        )}
      </div>

      {/* Botones de foto */}
      <div className="space-y-3">
        <button
          className="btn-grande"
          onClick={() => inputCamara.current?.click()}
          disabled={extrayendo}
        >
          <Camera className="h-6 w-6" /> Tomar foto
        </button>
        <button
          className="btn-out-grande"
          onClick={() => inputArchivo.current?.click()}
          disabled={extrayendo}
        >
          <Upload className="h-6 w-6" /> Subir archivo
        </button>
        <p className="text-center text-sm text-neutral-500">
          Toma la foto del recibo o súbelo desde la computadora.
        </p>
        <input
          ref={inputCamara}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={elegirArchivo}
        />
        <input
          ref={inputArchivo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={elegirArchivo}
        />
      </div>

      {/* Preview + extracción */}
      {(preview || extrayendo || error) && (
        <div className="tarjeta">
          {preview && (
            <img src={preview} alt="recibo" className="mx-auto max-h-64 rounded-lg object-contain" />
          )}
          {extrayendo && (
            <p className="mt-4 flex items-center justify-center gap-2 text-neutral-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Leyendo el recibo…
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
          )}
        </div>
      )}

      {/* Revisar datos extraídos */}
      {datos && (
        <div className="tarjeta">
          <h2 className="mb-1 text-xl font-bold">Revisa los datos</h2>
          <p className="mb-4 text-neutral-500">
            Corrige lo que haga falta antes de guardar.
          </p>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="etiqueta">Proveedor</label>
                <input className="campo" value={datos.proveedor} onChange={setCampo('proveedor')} />
              </div>
              <div>
                <label className="etiqueta">Fecha</label>
                <input type="date" className="campo" value={datos.fecha_factura} onChange={setCampo('fecha_factura')} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="etiqueta"># Factura</label>
                <input className="campo" value={datos.numero_factura} onChange={setCampo('numero_factura')} />
              </div>
              <div>
                <label className="etiqueta">Categoría</label>
                <select className="campo" value={datos.categoria} onChange={setCampo('categoria')}>
                  {CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="etiqueta">Subtotal</label>
                <input type="number" step="0.01" className="campo" value={datos.subtotal} onChange={setCampo('subtotal')} />
              </div>
              <div>
                <label className="etiqueta">Impuesto</label>
                <input type="number" step="0.01" className="campo" value={datos.impuesto} onChange={setCampo('impuesto')} />
              </div>
              <div>
                <label className="etiqueta">Total</label>
                <input type="number" step="0.01" className="campo font-semibold" value={datos.total} onChange={setCampo('total')} />
              </div>
            </div>

            {datos.items?.length > 0 && (
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">
                  Renglones detectados ({datos.items.length})
                </p>
                <ul className="space-y-1">
                  {datos.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate">{it.descripcion}</span>
                      <span className="shrink-0 text-neutral-500">{money(it.total_linea)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="btn-grande mt-2" onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {guardando ? 'Guardando…' : 'Guardar factura'}
            </button>
          </div>
        </div>
      )}

      {/* Facturas guardadas */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Facturas</h2>
          <span className="rounded-full bg-tinta px-4 py-1.5 font-semibold text-marca">
            Total {money(totalGastado)}
          </span>
        </div>
        {facturas.length === 0 ? (
          <p className="text-neutral-400">Todavía no hay facturas para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {facturas.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{f.proveedor || 'Sin proveedor'}</p>
                  <p className="text-sm text-neutral-500">
                    {fecha(f.fecha_factura)}
                    {f.categoria ? ` · ${f.categoria}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{money(f.total)}</p>
                {f.imagen_url && (
                  <a
                    href={f.imagen_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-marca-oscuro underline"
                  >
                    ver
                  </a>
                )}
                <button
                  onClick={() => borrarFactura(f.id)}
                  className="shrink-0 rounded p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar factura"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ubicaciones (sección secundaria) */}
      <div className="border-t border-neutral-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-neutral-600">Ubicaciones</h3>
          <button className="btn-borde !px-3 !py-1.5 text-sm" onClick={() => setModalUbicacion(true)}>
            <Plus className="h-4 w-4" /> Agregar ubicación
          </button>
        </div>
        {ubicaciones.length === 0 ? (
          <p className="text-sm text-neutral-400">Este cliente aún no tiene ubicaciones.</p>
        ) : (
          <ul className="space-y-2">
            {ubicaciones.map((u) => (
              <li key={u.id} className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                <span>
                  {u.etiqueta ? `${u.etiqueta}: ` : ''}
                  {[u.direccion, u.ciudad, u.estado].filter(Boolean).join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalUbicacion && (
        <FormularioUbicacion
          clienteId={id}
          onCerrar={() => setModalUbicacion(false)}
          onGuardado={() => { setModalUbicacion(false); cargarUbicaciones() }}
        />
      )}
    </div>
  )
}
