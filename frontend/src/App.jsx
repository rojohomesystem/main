import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Clientes from './pages/Clientes.jsx'
import Cliente from './pages/Cliente.jsx'
import Cotizador from './pages/Cotizador.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Clientes />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<Cliente />} />
        <Route path="/cotizador" element={<Cotizador />} />
        <Route path="*" element={<Navigate to="/clientes" replace />} />
      </Routes>
    </Layout>
  )
}
