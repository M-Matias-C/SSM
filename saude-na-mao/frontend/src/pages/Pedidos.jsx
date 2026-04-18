import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import { useUiStore } from '../stores/store'
import { orderService } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import ReviewModal from '../components/ReviewModal'
import { Package, MapPin, Calendar, Truck, FileText, RefreshCw, AlertCircle, Star, RotateCcw } from 'lucide-react'

export default function Pedidos() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('todos')
  const [reviewOrder, setReviewOrder] = useState(null)
  const addNotification = useUiStore(s => s.addNotification)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [token, navigate])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await orderService.getAll()
      const data = response.data?.data
      const list = Array.isArray(data) ? data : (data?.pedidos || data?.docs || [])
      setOrders(list)
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
      setError('Não foi possível carregar seus pedidos')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'aguardando_pagamento': 'bg-yellow-100 text-yellow-800',
      'confirmado': 'bg-blue-100 text-blue-800',
      'enviado': 'bg-purple-100 text-purple-800',
      'entregue': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'aguardando_pagamento': 'Aguardando Pagamento',
      'confirmado': 'Confirmado',
      'enviado': 'Enviado',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado',
    }
    return labels[status] || status
  }

  const filteredOrders = filter === 'todos'
    ? orders
    : orders.filter(o => o.status === filter)

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'aguardando_pagamento', label: 'Aguardando' },
          { key: 'confirmado', label: 'Confirmado' },
          { key: 'enviado', label: 'Enviado' },
          { key: 'entregue', label: 'Entregue' },
          { key: 'cancelado', label: 'Cancelado' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button
            onClick={() => { setError(null); loadOrders() }}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            Nenhum pedido encontrado
          </p>
          <Link
            to="/produtos"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition"
          >
            Começar Compra
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id || order.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-sm text-gray-600">Pedido</p>
                  <p className="text-lg font-bold">#{(order._id || order.id || '').slice(-8).toUpperCase()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Data
                  </p>
                  <p className="font-semibold">
                    {new Date(order.createdAt || order.dataPedido).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {(order.total || order.valorTotal || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="text-right space-y-2">
                  <Link
                    to={`/pedido/${order._id || order.id}/comprovante`}
                    className="inline-flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition w-full justify-center"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Comprovante</span>
                  </Link>
                  <Link
                    to={`/rastreamento/${order._id || order.id}`}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition w-full justify-center"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Rastrear</span>
                  </Link>
                  {order.status === 'entregue' && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="inline-flex items-center gap-2 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-50 transition w-full justify-center"
                    >
                      <Star className="w-4 h-4" />
                      <span>Avaliar</span>
                    </button>
                  )}
                  {order.status === 'entregue' && (
                    <button
                      onClick={() => {
                        const reorderItems = (order.itens || []).map(i => ({
                          id: i.id_produto,
                          nome: i.nome_produto || i.nome,
                          preco: i.preco_unitario,
                          quantity: i.quantidade,
                          id_farmacia: order.id_farmacia?._id || order.id_farmacia,
                        }))
                        localStorage.setItem('reorder_items', JSON.stringify(reorderItems))
                        navigate('/carrinho')
                      }}
                      className="inline-flex items-center gap-2 border border-emerald-400 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition w-full justify-center"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reordenar</span>
                    </button>
                  )}
                </div>
              </div>

              {order.itens && order.itens.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    {order.itens.length} item{order.itens.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.itens.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-xs"
                      >
                        {item.nome || `Item ${idx + 1}`}
                      </span>
                    ))}
                    {order.itens.length > 3 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        +{order.itens.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          pharmacyId={reviewOrder.id_farmacia?._id || reviewOrder.id_farmacia}
          pharmacyName={reviewOrder.id_farmacia?.nome || 'Farmácia'}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => addNotification({ type: 'success', title: 'Avaliação enviada!', message: 'Obrigado pelo seu feedback' })}
        />
      )}
    </div>
  )
}
