import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import PrivateRoute from './components/PrivateRoute'
import Logger from './utils/logger'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatSupport from './components/ChatSupport'
import Home from './pages/Home'
import Farmacias from './pages/Farmacias'
import FarmaciaDetalhe from './pages/FarmaciaDetalhe'
import Produtos from './pages/Produtos'
import Carrinho from './pages/Carrinho'
import Checkout from './pages/Checkout'
import Receita from './pages/Receita'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Perfil from './pages/Perfil'
import Pedidos from './pages/Pedidos'
import Rastreamento from './pages/Rastreamento'
import Suporte from './pages/Suporte'
import Admin from './pages/Admin'
import Farmaceutico from './pages/Farmaceutico'
import Comprovante from './pages/Comprovante'
import Legal from './pages/Legal'
import './App.css'

const logger = new Logger('App')

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/farmacias" element={<Farmacias />} />
          <Route path="/farmacia/:id" element={<FarmaciaDetalhe />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route
            path="/checkout"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/receita"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <Receita />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <Pedidos />
              </PrivateRoute>
            }
          />
          <Route
            path="/rastreamento/:id"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <Rastreamento />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedido/:id/comprovante"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <Comprovante />
              </PrivateRoute>
            }
          />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/legal" element={<Legal />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="administrador">
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/farmaceutico"
            element={
              <PrivateRoute requiredRole="farmacia">
                <Farmaceutico />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <ChatSupport />
    </div>
  )
}

function App() {
  logger.info('App initialized')

  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  )
}

export default App
