import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import Logger from '../utils/logger'
import api from '../services/api'
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  Settings,
  LogOut,
  RefreshCw,
  Download,
  Eye,
  Trash2,
} from 'lucide-react'

const logger = new Logger('Admin')

export default function Admin() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
  })

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'admin') {
      logger.warn('Non-admin user tried to access admin panel')
      navigate('/')
      return
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats()
    }
  }, [activeTab])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      logger.info('Loading dashboard statistics')

      setStats({
        totalOrders: 1250,
        totalRevenue: 45320.50,
        totalProducts: 342,
        totalUsers: 5680,
        pendingOrders: 23,
      })

      setMessage('Dashboard atualizado com sucesso!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      logger.error('Failed to load dashboard stats', err)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setOrdersLoading(true)
      logger.info('Loading orders')

      setOrders([
        {
          id: 1,
          numero: 'PED-001',
          cliente: 'João Silva',
          status: 'pendente',
          total: 250.00,
          data: '2026-04-15',
          itens: 3,
        },
        {
          id: 2,
          numero: 'PED-002',
          cliente: 'Maria Santos',
          status: 'processando',
          total: 180.50,
          data: '2026-04-14',
          itens: 2,
        },
        {
          id: 3,
          numero: 'PED-003',
          cliente: 'Pedro Costa',
          status: 'enviado',
          total: 450.00,
          data: '2026-04-13',
          itens: 5,
        },
      ])
    } catch (err) {
      logger.error('Failed to load orders', err)
      setError('Erro ao carregar pedidos')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      logger.info('Loading products')

      setProducts([
        {
          id: 1,
          nome: 'Dipirona 500mg',
          preco: 15.90,
          estoque: 150,
          vendas: 450,
          categoria: 'Analgésicos',
        },
        {
          id: 2,
          nome: 'Vitamina C 1000mg',
          preco: 25.50,
          estoque: 200,
          vendas: 320,
          categoria: 'Vitaminas',
        },
        {
          id: 3,
          nome: 'Omeprazol 20mg',
          preco: 18.70,
          estoque: 85,
          vendas: 210,
          categoria: 'Medicamentos Prescritos',
        },
      ])
    } catch (err) {
      logger.error('Failed to load products', err)
      setError('Erro ao carregar produtos')
    } finally {
      setProductsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      logger.info('Loading users')

      setUsers([
        { id: 1, nome: 'João Silva', email: 'joao@email.com', status: 'ativo', pedidos: 5 },
        { id: 2, nome: 'Maria Santos', email: 'maria@email.com', status: 'ativo', pedidos: 12 },
        { id: 3, nome: 'Pedro Costa', email: 'pedro@email.com', status: 'inativo', pedidos: 2 },
      ])
    } catch (err) {
      logger.error('Failed to load users', err)
      setError('Erro ao carregar usuários')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      logger.info(`Updating order ${orderId} status to ${newStatus}`)

      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      setMessage('Status do pedido atualizado com sucesso!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      logger.error('Failed to update order status', err)
      setError('Erro ao atualizar status')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      logger.info(`Deleting product ${productId}`)

      setProducts(products.filter((p) => p.id !== productId))
      setMessage('Produto deletado com sucesso!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      logger.error('Failed to delete product', err)
      setError('Erro ao deletar produto')
    }
  }

  const handleLogout = () => {
    logger.info('Admin logout')
    logout()
    navigate('/login')
  }

  if (!isAuthenticated() || user?.role !== 'admin') {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Painel Administrativo
              </h1>
              <p className="text-blue-100 mt-1">Gerencia de Saúde na Mão</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Admin: {user?.nome}</p>
              <button
                onClick={handleLogout}
                className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex gap-2 mb-8 bg-white rounded-lg p-2 shadow-sm overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
            { id: 'products', label: 'Produtos', icon: Package },
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: 'Pedidos Total',
                    value: stats.totalOrders,
                    icon: ShoppingCart,
                    color: 'blue',
                  },
                  {
                    label: 'Receita Total',
                    value: `R$ ${stats.totalRevenue.toFixed(2)}`,
                    icon: TrendingUp,
                    color: 'green',
                  },
                  {
                    label: 'Produtos',
                    value: stats.totalProducts,
                    icon: Package,
                    color: 'purple',
                  },
                  {
                    label: 'Usuários',
                    value: stats.totalUsers,
                    icon: Users,
                    color: 'orange',
                  },
                  {
                    label: 'Pendentes',
                    value: stats.pendingOrders,
                    icon: AlertCircle,
                    color: 'red',
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{label}</p>
                        <p className="text-2xl font-bold mt-2">{value}</p>
                      </div>
                      <Icon
                        className={`w-10 h-10 text-${color}-500`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gerência de Pedidos</h2>
              <button
                onClick={loadOrders}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>

            {ordersLoading ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum pedido encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Número</th>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Data</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium">{order.numero}</td>
                        <td className="px-4 py-3">{order.cliente}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value)
                            }
                            className="px-3 py-1 rounded-lg border border-gray-300 text-sm"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="processando">Processando</option>
                            <option value="enviado">Enviado</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">R$ {order.total.toFixed(2)}</td>
                        <td className="px-4 py-3">{order.data}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => logger.info(`Viewing order ${order.id}`)}
                            className="text-blue-600 hover:text-blue-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gerência de Produtos</h2>
              <button
                onClick={loadProducts}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>

            {productsLoading ? (
              <LoadingSpinner />
            ) : products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum produto encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                      <th className="px-4 py-3 text-left font-semibold">Preço</th>
                      <th className="px-4 py-3 text-left font-semibold">Estoque</th>
                      <th className="px-4 py-3 text-left font-semibold">Vendas</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium">{product.nome}</td>
                        <td className="px-4 py-3">{product.categoria}</td>
                        <td className="px-4 py-3">R$ {product.preco.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              product.estoque > 50
                                ? 'bg-green-100 text-green-800'
                                : product.estoque > 10
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.estoque}
                          </span>
                        </td>
                        <td className="px-4 py-3">{product.vendas}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 transition">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gerência de Usuários</h2>
              <button
                onClick={loadUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>

            {usersLoading ? (
              <LoadingSpinner />
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum usuário encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Pedidos</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium">{u.nome}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              u.status === 'ativo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{u.pedidos}</td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-800 transition">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Configurações do Sistema</h2>

            <div className="space-y-6 max-w-2xl">
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Segurança</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                  Alterar Senha
                </button>
              </div>

              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Backup e Exportação</h3>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                  <Download className="w-4 h-4" />
                  Exportar Dados
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Sobre</h3>
                <p className="text-gray-600">Saúde na Mão - Sistema de Gerencimanto de Farmácia</p>
                <p className="text-gray-600">Versão: 1.0.0</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
