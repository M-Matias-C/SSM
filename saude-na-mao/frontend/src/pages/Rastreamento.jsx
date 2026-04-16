import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import { orderService } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import { Package, MapPin, Truck, CheckCircle, Clock } from 'lucide-react'

export default function Rastreamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadOrder()
  }, [id, token, navigate])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const response = await orderService.getById(id)
      const d = response.data?.data
      setOrder(d?.pedido || d || null)
    } catch (err) {
      console.error('Erro ao carregar pedido:', err)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Alert type="error" message="Pedido não encontrado" />
      </div>
    )
  }

  const getStepStatus = (step, currentStatus) => {
    const steps = ['confirmado', 'enviado', 'a_caminho', 'entregue']
    const currentIndex = steps.indexOf(currentStatus)
    const stepIndex = steps.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => navigate('/pedidos')}
        className="mb-6 text-primary hover:text-secondary font-medium"
      >
        ← Voltar aos Pedidos
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8 pb-8 border-b">
          <h1 className="text-3xl font-bold mb-4">Rastreamento do Pedido</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Número do Pedido</p>
              <p className="font-bold text-lg">#{(order._id || order.id || '').slice(-8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Data do Pedido</p>
              <p className="font-bold text-lg">
                {new Date(order.createdAt || order.dataPedido).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Valor Total</p>
              <p className="font-bold text-lg text-primary">
                R$ {(order.total || order.valorTotal || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Status da Entrega</h2>
          
          <div className="space-y-6 max-w-2xl">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  getStepStatus('confirmado', order.status) === 'completed'
                    ? 'bg-green-500 text-white'
                    : getStepStatus('confirmado', order.status) === 'current'
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className={`w-1 h-12 ${
                  getStepStatus('enviado', order.status) === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-lg">Pedido Confirmado</h3>
                <p className="text-gray-600">Seu pedido foi confirmado e está sendo preparado</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  getStepStatus('enviado', order.status) === 'completed'
                    ? 'bg-green-500 text-white'
                    : getStepStatus('enviado', order.status) === 'current'
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className={`w-1 h-12 ${
                  getStepStatus('a_caminho', order.status) === 'completed' ||
                  getStepStatus('a_caminho', order.status) === 'current'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-lg">Enviado para Entrega</h3>
                <p className="text-gray-600">Seu pedido saiu para entrega</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  getStepStatus('a_caminho', order.status) === 'completed'
                    ? 'bg-green-500 text-white'
                    : getStepStatus('a_caminho', order.status) === 'current'
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className={`w-1 h-12 ${
                  getStepStatus('entregue', order.status) === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-lg">A Caminho</h3>
                <p className="text-gray-600">Seu pedido está a caminho do endereço de entrega</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  getStepStatus('entregue', order.status) === 'completed'
                    ? 'bg-green-500 text-white'
                    : getStepStatus('entregue', order.status) === 'current'
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-lg">Entregue</h3>
                <p className="text-gray-600">Seu pedido foi entregue com sucesso</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Endereço de Entrega
          </h3>
          {typeof order.endereco_entrega === 'object' && order.endereco_entrega ? (
            <>
              <p className="text-gray-700 mb-2">
                {order.endereco_entrega.logradouro}, {order.endereco_entrega.numero}
                {order.endereco_entrega.complemento ? ` - ${order.endereco_entrega.complemento}` : ''}
              </p>
              <p className="text-gray-600 text-sm">
                {order.endereco_entrega.bairro} - {order.endereco_entrega.cidade || 'Goiânia'}/{order.endereco_entrega.estado || 'GO'}
              </p>
            </>
          ) : (
            <p className="text-gray-700">{order.endereco_entrega || 'Retirada na farmácia'}</p>
          )}
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">Itens do Pedido</h3>
          <div className="space-y-3">
            {order.itens?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-3">
                <span className="font-medium">{item.nome_produto || item.nome || `Item ${idx + 1}`}</span>
                <div className="text-right">
                  <p className="font-semibold">R$ {(item.preco_unitario || item.preco || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantidade || 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold mb-4">Dúvidas?</h3>
          <p className="text-gray-700 mb-4">
            Entre em contato com nosso suporte caso tenha alguma dúvida sobre seu pedido
          </p>
          <div className="flex gap-4">
            <a
              href="tel:0800123456"
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-blue-50 transition font-medium"
            >
              0800 123 456
            </a>
            <button
              onClick={() => navigate('/suporte')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-medium"
            >
              Chat com Suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
