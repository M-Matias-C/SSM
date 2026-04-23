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
import CheckoutIA from './pages/CheckoutIA'
import Receita from './pages/Receita'
import ReceitaDigital from './pages/ReceitaDigital'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import SecurityAuditDashboard from './pages/SecurityAuditDashboard'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Perfil from './pages/Perfil'
import Pedidos from './pages/Pedidos'
import Rastreamento from './pages/Rastreamento'
import MedicineTracking from './pages/MedicineTracking'
import QRVerification from './components/QRVerification'
import Suporte from './pages/Suporte'
import Admin from './pages/Admin'
import Farmaceutico from './pages/Farmaceutico'
import PharmacistDashboard from './pages/PharmacistDashboard'
import PharmacyDashboard from './pages/PharmacyDashboard'
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
            path="/checkout-ia"
            element={
              <PrivateRoute excludeRoles={['farmacia']}>
                <CheckoutIA />
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
          <Route
            path="/receita-digital/:id"
            element={
              <PrivateRoute>
                <ReceitaDigital />
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
                <MedicineTracking />
              </PrivateRoute>
            }
          />
          <Route
            path="/verificar-medicamento"
            element={
              <PrivateRoute>
                <QRVerification />
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
          <Route
            path="/dashboard/farmaceutico"
            element={
              <PrivateRoute requiredRole="farmacia">
                <PharmacistDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/farmacia"
            element={
              <PrivateRoute requiredRole="farmacia">
                <PharmacyDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <PrivateRoute requiredRole="farmacia">
                <AnalyticsDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/seguranca"
            element={
              <PrivateRoute requiredRole="administrador">
                <SecurityAuditDashboard />
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
