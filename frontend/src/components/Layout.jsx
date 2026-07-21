import { Link } from 'react-router-dom'
import { PaintRoller } from 'lucide-react'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {/* Barra superior única */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-5 py-4">
          <Link to="/clientes" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-tinta">
              <PaintRoller className="h-5 w-5 text-marca" />
            </div>
            <span className="font-display text-lg font-bold">
              Rojo Home Improvement
            </span>
          </Link>
          <Link
            to="/cotizador"
            className="text-neutral-500 underline-offset-4 transition hover:text-tinta hover:underline"
          >
            Cotizaciones
          </Link>
        </div>
      </header>

      {/* Contenido centrado */}
      <main className="mx-auto max-w-[900px] px-5 py-8">{children}</main>
    </div>
  )
}
