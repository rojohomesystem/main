import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { Plus, ChevronRight, X } from 'lucide-react'

// Colores de la franja de cada tarjeta (rotan según el índice)
const COLORES = ['#1D9E75', '#378ADD', '#D85A30', '#7F77DD']

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)

  async function cargarClientes() {
    setCargando(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*, ubicaciones(direccion)')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setClientes(data ?? [])
    setCargando(false)
  }

  useEffect(() => { cargarClientes() }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold">Hola, Wilson</h1>
      <p className="mt-1 text-neutral-500">Estos son tus clientes</p>

      <button className="btn-grande mt-6" onClick={() => setModal(true)}>
        <Plus className="h-6 w-6" /> Agregar cliente
      </button>

      <div className="mt-6 space-y-3">
        {cargando ? (
          <p className="text-neutral-400">Cargando…</p>
        ) : clientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
            Aún no hay clientes. Toca “Agregar cliente” para crear el primero.
          </div>
        ) : (
          clientes.map((c, i) => (
            <button
              key={c.id}
              onClick={() => navigate(`/clientes/${c.id}`)}
              className="flex w-full items-center gap-4 overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 text-left shadow-sm transition hover:border-neutral-300 hover:shadow"
            >
              <div
                className="self-stretch"
                style={{ width: 8, background: COLORES[i % COLORES.length] }}
              />
              <div className="min-w-0 flex-1 py-4">
                <p className="truncate text-lg font-semibold">{c.nombre}</p>
                <p className="truncate text-neutral-500">
                  {c.ubicaciones?.[0]?.direccion || c.empresa || 'Sin dirección'}
                </p>
              </div>
              <ChevronRight className="mr-4 h-6 w-6 shrink-0 text-neutral-400" />
            </button>
          ))
        )}
      </div>

      {modal && (
        <FormularioClienteSimple
          onCerrar={() => setModal(false)}
          onGuardado={() => { setModal(false); cargarClientes() }}
        />
      )}
    </div>
  )
}

// -------- Modal genérico (se reutiliza también en la página del cliente) --------
export function Modal({ titulo, children, onCerrar }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onCerrar} className="rounded p-1 hover:bg-neutral-100">
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// -------- Nuevo cliente: solo 3 campos grandes --------
function FormularioClienteSimple({ onCerrar, onGuardado }) {
  const [f, setF] = useState({ nombre: '', telefono: '', direccion: '' })
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function guardar() {
    if (!f.nombre.trim()) return alert('El nombre es obligatorio')
    setGuardando(true)
    const { data: cli, error } = await supabase
      .from('clientes')
      .insert({ nombre: f.nombre.trim(), telefono: f.telefono.trim() })
      .select()
      .single()
    if (error) {
      setGuardando(false)
      return alert('Error: ' + error.message)
    }
    if (f.direccion.trim()) {
      const { error: ubErr } = await supabase.from('ubicaciones').insert({
        cliente_id: cli.id,
        direccion: f.direccion.trim(),
        ciudad: 'Norwalk',
        estado: 'CT',
        etiqueta: 'Principal',
      })
      if (ubErr) alert('El cliente se guardó, pero la dirección no: ' + ubErr.message)
    }
    setGuardando(false)
    onGuardado()
  }

  return (
    <Modal titulo="Nuevo cliente" onCerrar={onCerrar}>
      <div className="grid gap-4">
        <div>
          <label className="etiqueta">Nombre *</label>
          <input
            className="campo !py-3 !text-base"
            value={f.nombre}
            onChange={set('nombre')}
            placeholder="Ej: María González"
            autoFocus
          />
        </div>
        <div>
          <label className="etiqueta">Teléfono</label>
          <input
            className="campo !py-3 !text-base"
            value={f.telefono}
            onChange={set('telefono')}
            placeholder="(203) 000-0000"
          />
        </div>
        <div>
          <label className="etiqueta">Dirección</label>
          <input
            className="campo !py-3 !text-base"
            value={f.direccion}
            onChange={set('direccion')}
            placeholder="123 Main St"
          />
        </div>
        <button className="btn-grande mt-2" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </Modal>
  )
}

// -------- Nueva ubicación (se usa desde la página del cliente) --------
export function FormularioUbicacion({ clienteId, onCerrar, onGuardado }) {
  const [f, setF] = useState({
    etiqueta: '', direccion: '', ciudad: 'Norwalk', estado: 'CT', codigo_postal: '', notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function guardar() {
    setGuardando(true)
    const { error } = await supabase.from('ubicaciones').insert({ ...f, cliente_id: clienteId })
    setGuardando(false)
    if (error) return alert('Error: ' + error.message)
    onGuardado()
  }

  return (
    <Modal titulo="Nueva ubicación" onCerrar={onCerrar}>
      <div className="grid gap-3">
        <div>
          <label className="etiqueta">Etiqueta</label>
          <input className="campo" value={f.etiqueta} onChange={set('etiqueta')} placeholder="Ej: Casa principal" />
        </div>
        <div>
          <label className="etiqueta">Dirección</label>
          <input className="campo" value={f.direccion} onChange={set('direccion')} placeholder="123 Main St" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Ciudad</label>
            <input className="campo" value={f.ciudad} onChange={set('ciudad')} />
          </div>
          <div>
            <label className="etiqueta">Estado</label>
            <input className="campo" value={f.estado} onChange={set('estado')} />
          </div>
          <div>
            <label className="etiqueta">Código postal</label>
            <input className="campo" value={f.codigo_postal} onChange={set('codigo_postal')} />
          </div>
        </div>
        <div>
          <label className="etiqueta">Notas</label>
          <textarea className="campo" rows={2} value={f.notas} onChange={set('notas')} />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button className="btn-borde" onClick={onCerrar}>Cancelar</button>
          <button className="btn-marca" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar ubicación'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
