import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore, useAuthStore } from '../stores/store'
import { orderService, geoService } from '../services/api'
import {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Package,
  MapPin,
  Truck,
  Clock,
} from 'lucide-react'

const PAYMENT_METHODS = [
  {
    id: 'pix',
    label: 'PIX',
    desc: 'Aprovação instantânea',
    icon: Smartphone,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'cartao_credito',
    label: 'Cartão de Crédito',
    desc: 'Visa, Master, Elo',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'cartao_debito',
    label: 'Cartão de Débito',
    desc: 'Débito na entrega',
    icon: CreditCard,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'dinheiro',
    label: 'Dinheiro',
    desc: 'Pagamento na entrega',
    icon: Banknote,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const { items, getTotal, clearCart } = useCartStore()

  const [paymentMethod, setPaymentMethod] = useState('')
  const [cardData, setCardData] = useState({ numero: '', nome: '', validade: '', cvv: '' })
  const [changeFor, setChangeFor] = useState('')
  const [address, setAddress] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Goiânia',
    estado: 'GO',
    cep: '',
  })
  const [loading, setLoading] = useState(false)
  const [orderCreated, setOrderCreated] = useState(null)
  const orderDoneRef = useRef(false)
  const [error, setError] = useState(null)
  const [cepLoading, setCepLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    if (items.length === 0 && !orderCreated && !orderDoneRef.current) {
      navigate('/carrinho')
    }
  }, [token, items, navigate, orderCreated])

  const handleCepBlur = async () => {
    const cep = address.cep?.replace(/\D/g, '')
    if (cep?.length !== 8) return
    try {
      setCepLoading(true)
      const res = await geoService.geocodeCep(cep)
      const data = res.data?.data
      if (data) {
        setAddress(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.cidade || data.localidade || prev.cidade,
          estado: data.estado || data.uf || prev.estado,
        }))
      }
    } catch { /* ignore */ }
    finally { setCepLoading(false) }
  }

  const cartState = JSON.parse(localStorage.getItem('checkout_data') || '{}')
  const subtotal = cartState.subtotal || getTotal()
  const taxaEntrega = cartState.taxaEntrega ?? 8
  const desconto = cartState.desconto || 0
  const total = cartState.total || Math.max(0, subtotal - desconto + taxaEntrega)
  const deliveryType = cartState.deliveryType || 'moto'
  const couponData = cartState.couponData || null
  const pharmacyName = items[0]?.nome_farmacia || cartState.pharmacyName || 'Farmácia'
  const pharmacyId = items[0]?.id_farmacia || cartState.pharmacyId || ''

  const needsAddress = deliveryType === 'moto'

  const hasControlled = items.some((i) => i.controlado)

  const handleSubmit = async () => {
    if (!paymentMethod) return

    if (needsAddress && (!address.logradouro || !address.numero || !address.bairro)) {
      return
    }

    try {
      setLoading(true)
      const orderData = {
        id_farmacia: pharmacyId,
        tipo_entrega: deliveryType,
        endereco_entrega: needsAddress ? address : {},
        subtotal,
        taxa_entrega: taxaEntrega,
        total,
        metodo_pagamento: paymentMethod,
        cupom: couponData
          ? { codigo: couponData.cupom?.codigo, desconto, frete_gratis: couponData.frete_gratis }
          : {},
        itens: items.map((item) => ({
          id_produto: item.id,
          nome_produto: item.nome,
          preco_unitario: item.preco,
          quantidade: item.quantity,
          subtotal: item.preco * item.quantity,
          controlado: item.controlado || false,
        })),
      }

      const res = await orderService.create(orderData)
      const pedido = res.data?.data?.pedido

      orderDoneRef.current = true
      setOrderCreated({
        ...pedido,
        _pharmacyName: pharmacyName,
        _total: total,
        _paymentMethod: paymentMethod,
        _hasControlled: hasControlled,
      })
      clearCart()
      localStorage.removeItem('checkout_data')
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
      setError(err.response?.data?.message || err.message || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  if (orderCreated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-500 mb-6">
            Seu pedido foi recebido e está sendo preparado pela farmácia.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pedido</span>
              <span className="font-bold">#{orderCreated._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Farmácia</span>
              <span className="font-medium">{orderCreated._pharmacyName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pagamento</span>
              <span className="font-medium">
                {PAYMENT_METHODS.find((m) => m.id === orderCreated._paymentMethod)?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-primary">R$ {orderCreated._total?.toFixed(2)}</span>
            </div>
          </div>

          {orderCreated._hasControlled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-amber-800 font-semibold mb-1">⚠️ Medicamento Controlado</p>
              <p className="text-xs text-amber-700">
                O entregador precisará recolher a receita física no momento da entrega.
                Tenha-a em mãos.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/pedido/${orderCreated._id}/comprovante`}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-secondary transition flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" /> Ver Comprovante
            </Link>
            <Link
              to="/pedidos"
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Meus Pedidos
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo estimado: 45-60 min</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/carrinho" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
      </Link>

      <h1 className="text-3xl font-bold mb-1">Finalizar Pedido</h1>
      <p className="text-gray-500 mb-8">{pharmacyName} · {items.length} {items.length === 1 ? 'item' : 'itens'}</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Endereço de Entrega */}
          {needsAddress && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Endereço de Entrega
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    value={address.logradouro}
                    onChange={(e) => setAddress({ ...address, logradouro: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Ex: Rua T-63"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número</label>
                  <input
                    type="text"
                    value={address.numero}
                    onChange={(e) => setAddress({ ...address, numero: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={address.complemento}
                    onChange={(e) => setAddress({ ...address, complemento: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Apto, Bloco..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={address.bairro}
                    onChange={(e) => setAddress({ ...address, bairro: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Ex: Setor Bueno"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CEP</label>
                  <input
                    type="text"
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                    onBlur={handleCepBlur}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="74000-000"
                  />
                  {cepLoading && <span className="text-xs text-gray-400 mt-1">Buscando CEP...</span>}
                </div>
              </div>
            </div>
          )}

          {/* Método de Pagamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Método de Pagamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                const selected = paymentMethod === method.id
                return (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                      selected
                        ? `${method.border} ${method.bg}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selected}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg ${method.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.desc}</div>
                    </div>
                    {selected && (
                      <CheckCircle className={`w-5 h-5 ml-auto ${method.color}`} />
                    )}
                  </label>
                )
              })}
            </div>

            {/* Dados do Cartão (visual only) */}
            {(paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito') && (
              <div className="mt-5 p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-xs text-gray-400 mb-2">Os dados abaixo são apenas ilustrativos e não serão processados.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número do Cartão</label>
                  <input
                    type="text"
                    value={cardData.numero}
                    onChange={(e) => setCardData({ ...cardData, numero: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome no Cartão</label>
                  <input
                    type="text"
                    value={cardData.nome}
                    onChange={(e) => setCardData({ ...cardData, nome: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="NOME SOBRENOME"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Validade</label>
                    <input
                      type="text"
                      value={cardData.validade}
                      onChange={(e) => setCardData({ ...cardData, validade: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="000"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="mt-5 p-4 bg-orange-50 rounded-xl">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precisa de troco para quanto?</label>
                <input
                  type="text"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Ex: R$ 100,00 (deixe vazio se não precisa)"
                />
              </div>
            )}

            {paymentMethod === 'pix' && (
              <div className="mt-5 p-4 bg-emerald-50 rounded-xl flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Pagamento via PIX</p>
                  <p className="text-xs text-emerald-600">
                    Após confirmar, o QR Code será gerado para pagamento instantâneo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo lateral */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
            <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">
                    {item.quantity}x {item.nome}
                    {item.controlado && <span className="text-red-500 ml-1">⚕</span>}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    R$ {(item.preco * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span className={taxaEntrega === 0 ? 'text-emerald-600 font-medium' : ''}>
                  {taxaEntrega === 0 ? 'Grátis' : `R$ ${taxaEntrega.toFixed(2)}`}
                </span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span>-R$ {desconto.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center mb-5">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
            </div>

            {hasControlled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-amber-800">⚠️ Receita Obrigatória</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  O entregador buscará a receita física. Tenha-a pronta na entrega.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-3">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!paymentMethod || loading}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar Pedido
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Pagamento seguro e protegido</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
